# SmartBiz ERP — No-Domain Deployment Guide

Deploy the full stack without a custom domain or SSL certificate setup.

- **Frontend:** `https://<id>.cloudfront.net` — default CloudFront URL
- **Backend:** `http://<alb-dns>.us-east-1.elb.amazonaws.com` — ALB URL on port 80

This is the fastest path to a working deployment. You can attach a custom domain later without changing any code — just flip `use_custom_domain = true` in the tfvars and re-run the infra pipeline.

**Time to complete:** ~30–45 minutes

---

## What Is Different vs the Custom Domain Guide

| Thing | Custom Domain | No Domain (this guide) |
|---|---|---|
| Frontend URL | `https://example.com` | `https://xxxx.cloudfront.net` |
| Backend URL | `https://api.example.com` | `http://xxxx.elb.amazonaws.com` |
| ACM Certificate (frontend) | Terraform provisions automatically | Not needed |
| ACM Certificate (backend) | Manual one-time setup | Not needed |
| Route53 hosted zone | Required | Not needed |
| `use_custom_domain` tfvar | `true` | `false` (default) |
| K8s ingress | HTTPS + host rule | HTTP only, no host rule |

---

## Prerequisites

```bash
aws --version      # AWS CLI v2
terraform --version  # >= 1.5
kubectl version    # >= 1.28
helm version       # >= 3.12
java --version     # Java 21
mvn --version      # Maven 3.9+
node --version     # Node.js 20+
docker --version   # Docker 24+
```

Configure AWS CLI:
```bash
aws configure
# AWS Access Key ID:     <your-key>
# AWS Secret Access Key: <your-secret>
# Default region:        us-east-1
# Default output format: json

aws sts get-caller-identity   # verify
```

---

## Phase 0 — One-Time Bootstrap

### Step 1 — Terraform State Backend

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket terraform-state-erp-project \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket terraform-state-erp-project \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket terraform-state-erp-project \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 2 — Create ECR Repositories

```bash
cd smartbiz-erp
chmod +x scripts/bootstrap-ecr.sh
./scripts/bootstrap-ecr.sh us-east-1
# Creates: smartbiz-user-service, smartbiz-inventory-service, smartbiz-sales-service
```

---

## Phase 1 — Provision EKS via Jenkins

### Step 3 — Create the EKS Infra Pipeline in Jenkins

1. Jenkins → **New Item** → `smartbiz-eks-infra` → **Pipeline** → OK
2. Pipeline → Definition: `Pipeline script from SCM`
3. SCM: Git → your repo URL → Branch: `main`
4. Script Path: `infra/backend/Jenkinsfile`
5. **Save**

Create AWS credential first (Manage Jenkins → Credentials → Global → Add):
- Kind: **AWS Credentials**
- ID: `aws-terraform-credentials`

Install Terraform on the Jenkins agent:
```bash
TERRAFORM_VERSION=1.8.5
wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### Step 4 — Run EKS Infra Pipeline

1. Jenkins → `smartbiz-eks-infra` → **Build with Parameters**
2. `ENVIRONMENT=dev`, `ACTION=apply` → **Build**
3. Review `tfplan.txt` artifact when the Plan stage finishes
4. Click **"Yes, run apply on dev"** → wait ~15 minutes

From the Output stage, copy and run:
```bash
aws eks update-kubeconfig --name eks-dev --region us-east-1
kubectl get nodes   # should show nodes in Ready state
```

### Step 5 — Install AWS Load Balancer Controller

Required for the ALB Ingress to work.

```bash
helm repo add eks https://aws.github.io/eks-charts && helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eks-dev \
  --set serviceAccount.create=true \
  --set region=us-east-1 \
  --set vpcId=$(aws eks describe-cluster \
    --name eks-dev \
    --query "cluster.resourcesVpcConfig.vpcId" \
    --output text)

kubectl get deployment aws-load-balancer-controller -n kube-system
```

> If pods stay Pending — attach the IAM policy:
> ```bash
> curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
> aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document file://iam-policy.json
> ```
> Then attach `AWSLoadBalancerControllerIAMPolicy` to the EKS node role (`eks-dev-node-role`) in IAM console.

---

## Phase 2 — Database Setup

### Step 6 — MongoDB Atlas

1. Go to https://cloud.mongodb.com → create free cluster
2. Create database user: `smartbiz-user` with `readWriteAnyDatabase` role
3. Network Access → Add IP: `0.0.0.0/0` (for testing) or your EKS NAT Gateway IP
4. Connect → Drivers → copy the connection string

Three URIs needed:
```
mongodb+srv://smartbiz-user:<pass>@cluster0.xxxxx.mongodb.net/smartbiz_users?retryWrites=true&w=majority
mongodb+srv://smartbiz-user:<pass>@cluster0.xxxxx.mongodb.net/smartbiz_inventory?retryWrites=true&w=majority
mongodb+srv://smartbiz-user:<pass>@cluster0.xxxxx.mongodb.net/smartbiz_sales?retryWrites=true&w=majority
```

### Step 7 — Create Kubernetes Secrets

```bash
# Generate JWT secret
JWT_KEY=$(openssl rand -base64 32)
echo "Save this JWT key: $JWT_KEY"

# Create namespace first
kubectl apply -f smartbiz-erp/k8s/namespace.yaml

# Create the secret — replace URIs with your Atlas connection strings
kubectl create secret generic smartbiz-secrets \
  --namespace=smartbiz \
  --from-literal=JWT_SECRET="$JWT_KEY" \
  --from-literal=MONGO_URI_USERS="mongodb+srv://smartbiz-user:<pass>@cluster0.xxxxx.mongodb.net/smartbiz_users?retryWrites=true&w=majority" \
  --from-literal=MONGO_URI_INVENTORY="mongodb+srv://smartbiz-user:<pass>@cluster0.xxxxx.mongodb.net/smartbiz_inventory?retryWrites=true&w=majority" \
  --from-literal=MONGO_URI_SALES="mongodb+srv://smartbiz-user:<pass>@cluster0.xxxxx.mongodb.net/smartbiz_sales?retryWrites=true&w=majority"
```

---

## Phase 3 — Deploy Backend via Jenkins

### Step 8 — Configure Jenkins Credentials

Manage Jenkins → Credentials → Global → Add each:

| ID | Kind | Value |
|---|---|---|
| `aws-terraform-credentials` | AWS Credentials | AWS access key + secret |
| `sonar-token` | Secret text | SonarQube token |
| `jwt-secret` | Secret text | The JWT_KEY from Step 7 |
| `mongo-uri-users` | Secret text | Atlas URI for smartbiz_users |
| `mongo-uri-inventory` | Secret text | Atlas URI for smartbiz_inventory |
| `mongo-uri-sales` | Secret text | Atlas URI for smartbiz_sales |

### Step 9 — Create Backend Deploy Pipeline

1. Jenkins → **New Item** → `smartbiz-backend-deploy` → **Pipeline** → OK
2. Pipeline → Definition: `Pipeline script from SCM`
3. Script Path: `smartbiz-erp/Jenkinsfile.backend` → **Save**

### Step 10 — Run Backend Deploy Pipeline

1. Jenkins → `smartbiz-backend-deploy` → **Build with Parameters**
2. `ENVIRONMENT=dev` → **Build**
3. Pipeline: Test → SonarQube → Build JARs → Docker Push ECR → Deploy to EKS → Verify

### Step 11 — Get the ALB URL

After the pipeline finishes:
```bash
kubectl get ingress smartbiz-ingress -n smartbiz
# NAME               CLASS   HOSTS   ADDRESS                                        PORTS   AGE
# smartbiz-ingress   alb     *       k8s-smartbiz-xxxx.us-east-1.elb.amazonaws.com  80      2m
```

The **ADDRESS** column is your backend URL. Test it:
```bash
ALB_URL="http://$(kubectl get ingress smartbiz-ingress -n smartbiz -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
echo "Backend URL: $ALB_URL"

curl $ALB_URL/actuator/health
# Expected: {"status":"UP"}
```

### Step 12 — Seed the Database

```bash
# Create first admin user
curl -X POST $ALB_URL/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@smartbiz.com","password":"admin123","role":"ADMIN"}'

# Verify login
curl -X POST $ALB_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartbiz.com","password":"admin123"}'
# Expected: {"token":"eyJ..."}
```

---

## Phase 4 — Provision Frontend Infra via Jenkins

### Step 13 — Verify tfvars are set to no-domain mode

The default is already correct — confirm:
```
infra/frontend/terraform/envs/dev/terraform.tfvars
  use_custom_domain = false   ← this is the default, no changes needed
```

### Step 14 — Create Frontend Infra Pipeline

1. Jenkins → **New Item** → `smartbiz-frontend-infra` → **Pipeline** → OK
2. Script Path: `infra/frontend/Jenkinsfile` → **Save**

### Step 15 — Run Frontend Infra Pipeline

1. Jenkins → `smartbiz-frontend-infra` → **Build with Parameters**
2. `ENVIRONMENT=dev`, `ACTION=apply` → **Build**
3. Approve when prompted → wait ~3 minutes

From the **Output** stage, note:
- `website_url` → `https://xxxx.cloudfront.net` — **this is your frontend URL**
- `cloudfront_distribution_id` → needed for cache invalidation
- `s3_bucket_name` → `erp-frontend-dev`

---

## Phase 5 — Deploy Frontend via Jenkins

### Step 16 — Create Frontend Deploy Pipeline

1. Jenkins → **New Item** → `smartbiz-frontend-deploy` → **Pipeline** → OK
2. Script Path: `smartbiz-erp/Jenkinsfile.frontend` → **Save**

### Step 17 — Run Frontend Deploy Pipeline

1. Jenkins → `smartbiz-frontend-deploy` → **Build with Parameters**
2. Set:
   - `ENVIRONMENT` = `dev`
   - `API_BASE_URL` = `http://<your-alb-address>` (from Step 11)
   - `INVALIDATE_CDN` = ✅ checked
3. Click **Build**

The pipeline injects the ALB URL as `VITE_USER_API`, `VITE_INVENTORY_API`, `VITE_SALES_API` and bakes them into the React bundle at build time.

### Step 18 — Open the App

```bash
# Get the CloudFront URL from the Output stage, then:
echo "Open: https://xxxx.cloudfront.net"
echo "Login: admin@smartbiz.com / admin123"
```

> CloudFront may take 1–2 minutes to propagate after the first deploy.

---

## Phase 6 — Verify

```bash
# Get ALB URL
ALB_URL="http://$(kubectl get ingress smartbiz-ingress -n smartbiz -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"

# Get JWT token
TOKEN=$(curl -s -X POST $ALB_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartbiz.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Test all three services
curl -s $ALB_URL/api/users     -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -10
curl -s $ALB_URL/api/products  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -10
curl -s $ALB_URL/api/customers -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -10

# Check pod health
kubectl get pods -n smartbiz
```

Open `https://xxxx.cloudfront.net/settings` — all three service cards should show **Healthy**.

---

## Switching to Custom Domain Later

When you're ready to attach a real domain, no code changes needed — just update tfvars and re-run the pipelines:

**Step 1 — Update frontend tfvars:**
```hcl
# infra/frontend/terraform/envs/prod/terraform.tfvars
use_custom_domain = true
domain_name       = "example.com"
hosted_zone_id    = "Z1234ABCDEFGHIJ"
```

**Step 2 — Create Route53 hosted zone** (one-time manual):
```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='example.com.'].Id" --output text
```

**Step 3 — Request ACM cert for `api.example.com`** (backend only, one-time manual):
```bash
aws acm request-certificate --domain-name "api.example.com" --validation-method DNS --region us-east-1
# Validate via DNS in Route53 console
```

**Step 4 — Update ingress for HTTPS:**
In `smartbiz-erp/k8s/ingress.yaml` — uncomment the three HTTPS annotation lines and add `host: api.example.com`.

**Step 5 — Re-run pipelines:**
```
smartbiz-frontend-infra   ENVIRONMENT=prod  ACTION=apply
smartbiz-backend-deploy   ENVIRONMENT=prod
smartbiz-frontend-deploy  ENVIRONMENT=prod  API_BASE_URL=https://api.example.com
```

**Step 6 — Add Route53 A alias for `api.example.com`:**
After backend deploy, get the ALB address and add an A alias record in Route53 console pointing to it.

---

## Troubleshooting

### ALB not created
```bash
kubectl describe ingress smartbiz-ingress -n smartbiz
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Pods not starting
```bash
kubectl describe pod <pod> -n smartbiz
kubectl logs <pod> -n smartbiz
```

### 502 from ALB
```bash
# Pods might not be ready yet
kubectl get endpoints -n smartbiz
kubectl rollout status deployment/user-service -n smartbiz
```

### CORS error in browser console
The backend CORS config uses `setAllowedOriginPatterns` which covers `*.cloudfront.net` automatically. If you still see CORS errors, verify the CloudFront URL starts with `https://` (not `http://`) and the ALB is returning the correct headers:
```bash
curl -I -H "Origin: https://xxxx.cloudfront.net" $ALB_URL/api/auth/login
# Look for: Access-Control-Allow-Origin: https://xxxx.cloudfront.net
```

### Frontend shows blank page
```bash
# Check if S3 has files
aws s3 ls s3://erp-frontend-dev/

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <dist-id> \
  --paths "/*"
```
