# SmartBiz ERP — Complete Step-by-Step Deployment Guide

This guide walks through deploying the full SmartBiz ERP stack to AWS from scratch.

**What gets deployed:**
- Backend: 3 Spring Boot services on EKS (Kubernetes) behind an ALB
- Frontend: React/Vite app on S3 served via CloudFront
- Domain: `example.com` (frontend) and `api.example.com` (backend)
- Database: MongoDB Atlas (cloud) or self-managed

**Time to complete:** ~60–90 minutes (first time)

---

## Prerequisites

Make sure these are installed on your local machine before starting.

```bash
# Verify each one
aws --version          # AWS CLI v2
terraform --version    # >= 1.5
kubectl version        # >= 1.28
helm version           # >= 3.12
java --version         # Java 21
mvn --version          # Maven 3.9+
node --version         # Node.js 20+
docker --version       # Docker 24+
git --version
```

Install missing tools:
- AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html
- Terraform: https://developer.hashicorp.com/terraform/install
- kubectl: `curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/`
- Helm: https://helm.sh/docs/intro/install/
- Java 21: https://adoptium.net/

---

## Phase 0 — AWS Account Setup

### Step 1 — Configure AWS CLI

```bash
aws configure
# Enter:
#   AWS Access Key ID:     <your-access-key>
#   AWS Secret Access Key: <your-secret-key>
#   Default region:        us-east-1
#   Default output format: json

# Verify
aws sts get-caller-identity
```

### Step 2 — Bootstrap Terraform State Backend

This S3 bucket and DynamoDB table store all Terraform state. Run once.

```bash
# Create the S3 bucket
aws s3api create-bucket \
  --bucket terraform-state-erp-project \
  --region us-east-1

# Enable versioning (protects against accidental state deletion)
aws s3api put-bucket-versioning \
  --bucket terraform-state-erp-project \
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket terraform-state-erp-project \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create the DynamoDB lock table
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Step 3 — Create ECR Repositories

```bash
cd smartbiz-erp
chmod +x scripts/bootstrap-ecr.sh
./scripts/bootstrap-ecr.sh us-east-1
```

You should see three repositories created:
- `smartbiz-user-service`
- `smartbiz-inventory-service`
- `smartbiz-sales-service`

---

## What to Change Before You Deploy

This is the complete list of every value you need to replace with your own. Change these files in your repo before running any pipeline.

### 1. Domain names — Frontend Terraform tfvars

These files tell Terraform what domain to use for each environment.

**`infra/frontend/terraform/envs/dev/terraform.tfvars`**
```hcl
domain_name    = "dev.example.com"     # ← your dev subdomain
hosted_zone_id = "Z1234ABCDEFGHIJ"     # ← your Route53 hosted zone ID
bucket_name    = "erp-frontend-dev"    # ← must be globally unique in S3
```

**`infra/frontend/terraform/envs/stage/terraform.tfvars`**
```hcl
domain_name    = "stage.example.com"   # ← your stage subdomain
hosted_zone_id = "Z1234ABCDEFGHIJ"     # ← same hosted zone ID
bucket_name    = "erp-frontend-stage"
```

**`infra/frontend/terraform/envs/prod/terraform.tfvars`**
```hcl
domain_name    = "example.com"         # ← your apex domain (prod = root domain)
hosted_zone_id = "Z1234ABCDEFGHIJ"     # ← same hosted zone ID
bucket_name    = "erp-frontend-prod"
```

> Get your hosted zone ID:
> ```bash
> aws route53 list-hosted-zones --query "HostedZones[?Name=='example.com.'].Id" --output text
> # Strip /hostedzone/ prefix — use only the ID part e.g. Z1234ABCDEFGHIJ
> ```

### 2. State bucket name — Backend configs

If you used a different S3 bucket name for Terraform state (not `terraform-state-erp-project`), update the backend block in all six `main.tf` files:

```
infra/backend/terraform/envs/dev/main.tf
infra/backend/terraform/envs/stage/main.tf
infra/backend/terraform/envs/prod/main.tf
infra/frontend/terraform/envs/dev/main.tf
infra/frontend/terraform/envs/stage/main.tf
infra/frontend/terraform/envs/prod/main.tf
```

Change this line in each file:
```hcl
bucket = "terraform-state-erp-project"   # ← replace with your bucket name
```

### 3. Git repo URL — All Jenkinsfiles

Change the repo URL in all four Jenkinsfiles:
```
infra/backend/Jenkinsfile
infra/frontend/Jenkinsfile
smartbiz-erp/Jenkinsfile.backend
smartbiz-erp/Jenkinsfile.frontend
```

Change this line in each:
```groovy
url: 'https://github.com/CK23004/erp-project.git'   // ← your repo URL
```

### 4. ACM certificate ARN — K8s ingress (backend only)

The frontend ACM cert is handled automatically by Terraform.
The backend `api.example.com` cert must be created manually once (see Phase 1, Step 6), then paste the ARN here:

**`smartbiz-erp/k8s/ingress.yaml`**
```yaml
alb.ingress.kubernetes.io/certificate-arn: "REPLACE_WITH_ACM_CERT_ARN"
# ← paste: arn:aws:acm:us-east-1:123456789012:certificate/abc-def-123
```

### 5. SonarQube URL — Backend Jenkinsfile

**`smartbiz-erp/Jenkinsfile.backend`**
```groovy
SONAR_HOST = "http://localhost:9000"   // ← replace with your SonarQube URL
```

### 6. MongoDB URIs — Jenkins Credentials (not in code)

Never put MongoDB URIs in files. Store them as Jenkins credentials:
- `mongo-uri-users` → Secret text → `mongodb+srv://user:pass@cluster.mongodb.net/smartbiz_users?retryWrites=true&w=majority`
- `mongo-uri-inventory` → Secret text → same pattern for `smartbiz_inventory`
- `mongo-uri-sales` → Secret text → same pattern for `smartbiz_sales`

### 7. CORS allowed origins — SecurityConfig

All three backend SecurityConfig files already include `https://example.com`. If your real domain is different, update:
```
smartbiz-erp/backend/user-service/src/main/java/com/smartbiz/userservice/config/SecurityConfig.java
smartbiz-erp/backend/inventory-service/src/main/java/com/smartbiz/inventoryservice/config/SecurityConfig.java
smartbiz-erp/backend/sales-service/src/main/java/com/smartbiz/salesservice/config/SecurityConfig.java
```
Change this block in each:
```java
config.setAllowedOrigins(List.of(
    "http://localhost:5173",
    "http://localhost",
    "https://example.com",      // ← your real domain
    "https://www.example.com"   // ← www variant
));
```

---

## What Terraform Handles Automatically

Once you update the values above, the Jenkins infrastructure pipelines handle everything else:

| Resource | Handled by |
|---|---|
| VPC, subnets, IGW, route tables | `smartbiz-eks-infra` pipeline |
| EKS cluster + node group | `smartbiz-eks-infra` pipeline |
| EKS addons (vpc-cni, coredns, kube-proxy) | `smartbiz-eks-infra` pipeline |
| S3 bucket (private, versioned, encrypted) | `smartbiz-frontend-infra` pipeline |
| ACM certificate for `example.com` | `smartbiz-frontend-infra` pipeline (auto DNS-validated) |
| CloudFront distribution + OAC | `smartbiz-frontend-infra` pipeline |
| Route53 A alias: `example.com` → CloudFront | `smartbiz-frontend-infra` pipeline |
| Route53 A alias: `www.example.com` → CloudFront | `smartbiz-frontend-infra` pipeline |

**What you do manually (one-time only):**

| Task | Why manual |
|---|---|
| Create Route53 hosted zone | Terraform needs the zone ID before it can run |
| Request ACM cert for `api.example.com` | Backend ALB cert — not in Terraform scope |
| Add Route53 A alias: `api.example.com` → ALB | ALB DNS name only exists after first `kubectl apply -f k8s/ingress.yaml` |

---

> **Use these pipelines to provision EKS and S3/CloudFront via Jenkins instead of running Terraform manually.** The two Jenkinsfiles already exist at `infra/backend/Jenkinsfile` and `infra/frontend/Jenkinsfile`. Follow the steps below to wire them into Jenkins.

Both pipelines share the same 6-stage flow:
```
Pull → Init → Plan (archived as artifact) → Approval (manual) → Execute → Output
```
Both accept two parameters:
- `ENVIRONMENT` — `dev` / `stage` / `prod`
- `ACTION` — `apply` (create/update) or `destroy` (tear down)

---

### Step A — Jenkins Prerequisites

**Install these Jenkins plugins** (Manage Jenkins → Plugins → Available):

| Plugin | Purpose |
|---|---|
| **Pipeline: AWS Steps** | `withAWS()` block that injects AWS credentials |
| **Git** | Clones the repo in the Pull stage |
| **Pipeline** | Declarative pipeline support |

**Create the AWS credential** (Manage Jenkins → Credentials → Global → Add):
- Kind: **AWS Credentials**
- ID: `aws-terraform-credentials`
- Access Key ID: your AWS access key
- Secret Access Key: your AWS secret key

**Install Terraform on the Jenkins agent:**
```bash
# On the Jenkins agent / master node
TERRAFORM_VERSION=1.8.5
wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip
sudo mv terraform /usr/local/bin/
terraform --version
```

---

### Step B — Create EKS Infra Pipeline

This pipeline provisions the EKS cluster (VPC, subnets, IAM roles, node group, addons).  
Jenkinsfile location in repo: `infra/backend/Jenkinsfile`

1. Jenkins → **New Item**
2. Name: `smartbiz-eks-infra`
3. Type: **Pipeline** → OK
4. Under **Pipeline**:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/CK23004/erp-project.git`
   - Branch: `main`
   - **Script Path:** `infra/backend/Jenkinsfile`
5. Click **Save**

**Run the pipeline — dev environment:**

1. Click **Build with Parameters**
2. Set:
   - `ENVIRONMENT` = `dev`
   - `ACTION` = `apply`
3. Click **Build**

**What happens in each stage:**

| Stage | What it does |
|---|---|
| **Pull** | Clones the repo, confirms `terraform/envs/dev/` exists |
| **Init** | Runs `terraform init` — downloads AWS provider, configures S3 backend (`eks/dev/terraform.tfstate`) |
| **Plan** | Runs `terraform plan`, saves `tfplan.binary`, archives `tfplan.txt` as a build artifact |
| **Approval** | Pipeline pauses — **click the artifact `tfplan.txt` to review** what will be created, then click **"Yes, run apply on dev"** |
| **Execute** | Runs `terraform apply tfplan.binary` — creates VPC, EKS cluster, node group (~15 min) |
| **Output** | Prints `cluster_name`, `cluster_endpoint`, and `configure_kubectl` command |

4. After the pipeline finishes, copy the `configure_kubectl` command from the Output stage:
```bash
aws eks update-kubeconfig --name eks-dev --region us-east-1
kubectl get nodes
```

**Repeat for stage and prod** by running the pipeline again with `ENVIRONMENT=stage` and `ENVIRONMENT=prod`.

---

### Step C — Create Frontend Infra Pipeline

This pipeline provisions S3 bucket, CloudFront distribution, ACM certificate (auto DNS-validated), and Route53 records for the frontend.  
Jenkinsfile location in repo: `infra/frontend/Jenkinsfile`

1. Jenkins → **New Item**
2. Name: `smartbiz-frontend-infra`
3. Type: **Pipeline** → OK
4. Under **Pipeline**:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `https://github.com/CK23004/erp-project.git`
   - Branch: `main`
   - **Script Path:** `infra/frontend/Jenkinsfile`
5. Click **Save**

**Before running — update tfvars with your real domain:**

Edit these files in your repo and push before triggering the pipeline:

```bash
# infra/frontend/terraform/envs/dev/terraform.tfvars
aws_region     = "us-east-1"
environment    = "dev"
bucket_name    = "erp-frontend-dev"
domain_name    = "dev.example.com"        # ← your real domain
hosted_zone_id = "Z1234ABCDEFGHIJ"        # ← your real Route53 hosted zone ID

# infra/frontend/terraform/envs/prod/terraform.tfvars
aws_region     = "us-east-1"
environment    = "prod"
bucket_name    = "erp-frontend-prod"
domain_name    = "example.com"            # ← apex domain for prod
hosted_zone_id = "Z1234ABCDEFGHIJ"        # ← same hosted zone ID
```

**Run the pipeline — prod environment:**

1. Click **Build with Parameters**
2. Set:
   - `ENVIRONMENT` = `prod`
   - `ACTION` = `apply`
3. Click **Build**

**What happens in each stage:**

| Stage | What it does |
|---|---|
| **Pull** | Clones the repo, confirms `infra/frontend/terraform/envs/prod/` exists |
| **Init** | Runs `terraform init` — configures S3 backend (`frontend/prod/terraform.tfstate`) |
| **Plan** | Plans S3 bucket, CloudFront, ACM cert, Route53 records — archives `tfplan.txt` |
| **Approval** | Pipeline pauses for review — click **"Yes, apply prod"** |
| **Execute** | Creates S3 + CloudFront + ACM cert + Route53 A records (~5 min) |
| **Output** | Prints `website_url`, `cloudfront_distribution_id`, `s3_bucket_name` |

4. From the Output stage, note:
   - `website_url` — your frontend URL (e.g. `https://example.com`)
   - `cloudfront_distribution_id` — needed for cache invalidation after deploys

---

### Step D — Correct Order to Run All Pipelines

Run pipelines in this exact order for a fresh deployment:

```
1. smartbiz-eks-infra          ENVIRONMENT=dev    ACTION=apply   ← EKS cluster for dev
2. smartbiz-frontend-infra     ENVIRONMENT=dev    ACTION=apply   ← S3+CF for dev frontend
3. smartbiz-backend-deploy     ENVIRONMENT=dev                   ← Deploy app to dev EKS
4. smartbiz-frontend-deploy    ENVIRONMENT=dev    API_BASE_URL=https://api.example.com

5. smartbiz-eks-infra          ENVIRONMENT=stage  ACTION=apply   ← Repeat for stage
6. smartbiz-frontend-infra     ENVIRONMENT=stage  ACTION=apply
7. smartbiz-backend-deploy     ENVIRONMENT=stage
8. smartbiz-frontend-deploy    ENVIRONMENT=stage

9. smartbiz-eks-infra          ENVIRONMENT=prod   ACTION=apply   ← Production last
10. smartbiz-frontend-infra    ENVIRONMENT=prod   ACTION=apply
11. smartbiz-backend-deploy    ENVIRONMENT=prod
12. smartbiz-frontend-deploy   ENVIRONMENT=prod
```

---

### Step E — Destroying Infrastructure

To tear down an environment completely (e.g. save costs on dev):

**Destroy app first, then infra:**

```
1. smartbiz-eks-infra       ENVIRONMENT=dev  ACTION=destroy   ← deletes EKS, VPC, nodes
2. smartbiz-frontend-infra  ENVIRONMENT=dev  ACTION=destroy   ← deletes S3, CloudFront
```

> ⚠️ **prod destroy** — the approval stage asks: `"Yes, run destroy on prod"`. Think twice before clicking.

---

---

## Phase 1 — One-Time Manual Steps (Before Jenkins Runs)

Only two things need to be done manually — because Terraform needs them to exist before it can run.

### Step 4 — Create Route53 Hosted Zone

Terraform creates DNS records inside your hosted zone, but cannot create the zone itself (it needs the zone ID as input).

1. Go to **AWS Console → Route53 → Hosted Zones → Create hosted zone**
2. Domain name: `example.com` — Type: **Public hosted zone** — Create
3. Note the **Hosted Zone ID** (format `Z1234ABCDEFGHIJ`)
4. Update your domain registrar's nameservers to the 4 NS records Route53 shows

```bash
# Get the hosted zone ID via CLI
aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='example.com.'].Id" \
  --output text
# Returns: /hostedzone/Z1234ABCDEFGHIJ — use only Z1234ABCDEFGHIJ (strip the prefix)
```

> **Frontend certificate** (ACM for `example.com`) — **no manual steps needed**. The `smartbiz-frontend-infra` Jenkins pipeline handles it fully: requests the cert, creates DNS validation records in Route53, and waits for ISSUED status automatically.

### Step 5 — Request ACM Certificate for api.example.com (Backend only)

The ALB Ingress for the backend needs an ACM cert. This is the only cert not in Terraform.

```bash
# Request cert for the API subdomain
aws acm request-certificate \
  --domain-name "api.example.com" \
  --validation-method DNS \
  --region us-east-1
# Note the CertificateArn in the output

# Get the DNS validation CNAME record
aws acm describe-certificate \
  --certificate-arn <CERT_ARN> \
  --region us-east-1 \
  --query "Certificate.DomainValidationOptions[0]"
```

Then add the validation CNAME in Route53:
1. **AWS Console → Route53 → Hosted Zones → example.com → Create record**
2. Paste the `Name` and `Value` from the describe-certificate output
3. Type: CNAME, TTL: 300 — wait ~5 minutes for validation

Now update the ingress file with the validated ARN:
```bash
# smartbiz-erp/k8s/ingress.yaml
# alb.ingress.kubernetes.io/certificate-arn: "arn:aws:acm:us-east-1:123456789:certificate/abc-123"
```

---

## Phase 2 — EKS Cluster Provisioning via Jenkins

> **Use the `smartbiz-eks-infra` Jenkins pipeline** — do not run Terraform manually.  
> The `terraform.tfvars` files are already configured with sensible defaults (dev=t3.medium/1 node, prod=c7i-flex.large/2-4 nodes). Update them if you need different sizing.

### Step 6 — Run the EKS Infra Pipeline

1. Jenkins → `smartbiz-eks-infra` → **Build with Parameters**
2. Set `ENVIRONMENT=dev`, `ACTION=apply` → **Build**
3. Wait for the **Plan** stage to finish, then click the `tfplan.txt` artifact to review
4. Click **"Yes, run apply on dev"** in the Approval stage
5. Wait ~15 minutes for the Execute stage to finish

From the **Output** stage, copy the `configure_kubectl` command and run it locally:

```bash
aws eks update-kubeconfig --name eks-dev --region us-east-1
kubectl get nodes
# Should show 1–2 nodes in Ready state
```

Repeat for stage and prod by running the pipeline with `ENVIRONMENT=stage` and `ENVIRONMENT=prod`.

### Step 7 — Install AWS Load Balancer Controller

This is required for the ALB Ingress to work. Run once per cluster after `kubectl get nodes` is healthy.

```bash
# Add the EKS Helm chart repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install — replace eks-dev with your cluster name
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eks-dev \
  --set serviceAccount.create=true \
  --set region=us-east-1 \
  --set vpcId=$(aws eks describe-cluster \
    --name eks-dev \
    --query "cluster.resourcesVpcConfig.vpcId" \
    --output text)

# Verify controller is running
kubectl get deployment aws-load-balancer-controller -n kube-system
```

> **If pods stay Pending** — the controller needs IAM permissions. Attach the policy:
> ```bash
> curl -o iam-policy.json \
>   https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
> aws iam create-policy \
>   --policy-name AWSLoadBalancerControllerIAMPolicy \
>   --policy-document file://iam-policy.json
> ```
> Then go to **AWS Console → IAM → Roles**, find the EKS node role (named `eks-dev-node-role`), and attach `AWSLoadBalancerControllerIAMPolicy` to it.

---

---

## Phase 3 — Database Setup

### Step 11 — MongoDB Atlas Setup (Recommended for Production)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a new project: `smartbiz-erp`
3. Build a cluster:
   - **Dev/Stage:** M0 (Free tier)
   - **Production:** M10 or higher
4. Create a database user:
   - Username: `smartbiz-user`
   - Password: generate a strong password — save it
   - Role: `readWriteAnyDatabase`
5. Add Network Access:
   - For EKS: add your EKS VPC NAT Gateway IP (or `0.0.0.0/0` for testing)
6. Go to **Connect → Drivers** and copy the connection string

Your three connection strings will be:
```
mongodb+srv://smartbiz-user:<password>@cluster0.xxxxx.mongodb.net/smartbiz_users?retryWrites=true&w=majority
mongodb+srv://smartbiz-user:<password>@cluster0.xxxxx.mongodb.net/smartbiz_inventory?retryWrites=true&w=majority
mongodb+srv://smartbiz-user:<password>@cluster0.xxxxx.mongodb.net/smartbiz_sales?retryWrites=true&w=majority
```

### Step 12 — Create Kubernetes Secret with DB Credentials

```bash
# Generate a JWT secret
JWT_KEY=$(openssl rand -base64 32)
echo "JWT_SECRET: $JWT_KEY"   # save this — needed for Jenkins too

# Create the Kubernetes secret
# Replace the MONGO URIs with your Atlas connection strings
kubectl create secret generic smartbiz-secrets \
  --namespace=smartbiz \
  --from-literal=JWT_SECRET="$JWT_KEY" \
  --from-literal=MONGO_URI_USERS="mongodb+srv://smartbiz-user:<pass>@cluster0.xxxxx.mongodb.net/smartbiz_users?retryWrites=true&w=majority" \
  --from-literal=MONGO_URI_INVENTORY="mongodb+srv://smartbiz-user:<pass>@cluster0.xxxxx.mongodb.net/smartbiz_inventory?retryWrites=true&w=majority" \
  --from-literal=MONGO_URI_SALES="mongodb+srv://smartbiz-user:<pass>@cluster0.xxxxx.mongodb.net/smartbiz_sales?retryWrites=true&w=majority"

# Verify
kubectl get secret smartbiz-secrets -n smartbiz
```

---

## Phase 4 — Backend Application Deployment via Jenkins

> **Use the `smartbiz-backend-deploy` Jenkins pipeline** for all image builds, pushes, and K8s deployments.  
> Steps below are what the pipeline does automatically — follow them only if deploying manually for the first time or debugging.

### Step 13 — Run the Backend Deploy Pipeline

1. Jenkins → `smartbiz-backend-deploy` → **Build with Parameters**
2. Set `ENVIRONMENT=dev` → **Build**
3. Pipeline runs: Test → SonarQube → Build JARs → Docker Build+Push → Deploy to EKS → Verify
4. Watch the Output stage for pod status and ingress address

> **First run only** — before triggering the pipeline, make sure:
> - Jenkins credentials are created (Phase 6, Step 24)
> - ECR repos exist (`./scripts/bootstrap-ecr.sh`)
> - The K8s namespace and secrets exist (Step 12 above)

### Step 14 — Get the ALB DNS Name (after first deploy)

```bash
kubectl get ingress smartbiz-ingress -n smartbiz
# NAME               CLASS   HOSTS             ADDRESS                                        PORTS
# smartbiz-ingress   alb     api.example.com   k8s-smartbiz-xxx.us-east-1.elb.amazonaws.com   80,443
```

Copy the **ADDRESS** — you need it for Step 15.

### Step 15 — Create Route53 A Record for api.example.com

1. **AWS Console → Route53 → Hosted Zones → example.com → Create record**
2. Record name: `api` | Type: `A` | Alias: **ON**
3. Route traffic to: **Alias to Application and Classic Load Balancer** → us-east-1
4. Select your ALB from the dropdown → **Create records**

Wait 1–2 minutes, then test:
```bash
curl https://api.example.com/actuator/health
# Expected: {"status":"UP"}
```

### Step 16 — Seed the Database

```bash
# Create first admin user
curl -X POST https://api.example.com/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@example.com","password":"admin123","role":"ADMIN"}'

# Verify login works
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
# Expected: {"token":"eyJ...","name":"Admin User","role":"ADMIN"}
```

---

## Phase 5 — Frontend Deployment via Jenkins

> **Use `smartbiz-frontend-infra`** to provision S3+CloudFront (if not done already), then **`smartbiz-frontend-deploy`** to build and ship the React app.

### Step 19 — Run Frontend Infra Pipeline

1. Jenkins → `smartbiz-frontend-infra` → **Build with Parameters**
2. Set `ENVIRONMENT=prod`, `ACTION=apply` → **Build**
3. Approve when prompted — wait ~5 minutes
4. From the **Output** stage note:
   - `website_url` → e.g. `https://example.com`
   - `cloudfront_distribution_id` → used by the deploy pipeline for cache invalidation
   - `s3_bucket_name` → e.g. `erp-frontend-prod`

> Terraform automatically: requests ACM cert for `example.com`, DNS-validates it via Route53, creates CloudFront, and adds Route53 A alias records — no manual cert steps needed for the frontend.

### Step 20 — Run Frontend Deploy Pipeline

1. Jenkins → `smartbiz-frontend-deploy` → **Build with Parameters**
2. Set:
   - `ENVIRONMENT` = `prod`
   - `API_BASE_URL` = `https://api.example.com`
   - `INVALIDATE_CDN` = ✅ checked
3. Click **Build**

Pipeline stages: Install → Lint → Vite Build → Approval (prod) → S3 Sync → CloudFront Invalidation.

### Step 21 — Verify Frontend

```bash
curl -s -o /dev/null -w "%{http_code}" https://example.com
# Expected: 200
```

Open `https://example.com` → Login: `admin@example.com` / `admin123`.

---

## Phase 6 — Jenkins Setup (All Four Pipelines)

### Step 22 — Configure Jenkins Credentials

In Jenkins → **Manage Jenkins → Credentials → Global → Add Credential**:

| Credential ID | Kind | Value |
|---|---|---|
| `aws-terraform-credentials` | AWS Credentials | AWS access key + secret |
| `sonar-token` | Secret text | SonarQube user token |
| `jwt-secret` | Secret text | `openssl rand -base64 32` |
| `mongo-uri-users` | Secret text | Atlas URI for smartbiz_users |
| `mongo-uri-inventory` | Secret text | Atlas URI for smartbiz_inventory |
| `mongo-uri-sales` | Secret text | Atlas URI for smartbiz_sales |

### Step 23 — Create All Four Jenkins Pipelines

| Job name | Script Path | Purpose |
|---|---|---|
| `smartbiz-eks-infra` | `infra/backend/Jenkinsfile` | Provision EKS cluster |
| `smartbiz-frontend-infra` | `infra/frontend/Jenkinsfile` | Provision S3 + CloudFront |
| `smartbiz-backend-deploy` | `smartbiz-erp/Jenkinsfile.backend` | Build + deploy to EKS |
| `smartbiz-frontend-deploy` | `smartbiz-erp/Jenkinsfile.frontend` | Build + deploy to S3 |

For each:
1. Jenkins → **New Item** → enter name → **Pipeline** → OK
2. Pipeline → Definition: `Pipeline script from SCM`
3. SCM: Git → repo URL → Branch: `main`
4. Script Path: as above → **Save**

### Step 24 — Configure SonarQube

1. Jenkins → **Manage Jenkins → Configure System → SonarQube Servers → Add**
   - Name: `sonarqube`
   - Server URL: `http://your-sonarqube-host:9000`
   - Token: select `sonar-token` credential
2. In SonarQube UI → **Administration → Quality Gates** → create a gate:
   - Coverage > 60%
   - Duplicated Lines < 5%
   - No new Blocker issues
3. Assign the gate to all three projects:
   - `smartbiz-user-service`
   - `smartbiz-inventory-service`
   - `smartbiz-sales-service`

---

## Phase 7 — Verify Everything End-to-End

### Step 27 — Full End-to-End Test

```bash
# 1. Get JWT token
TOKEN=$(curl -s -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: ${TOKEN:0:30}..."

# 2. Test user-service
curl -s https://api.example.com/api/users \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20

# 3. Test inventory-service
curl -s https://api.example.com/api/products \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20

# 4. Test sales-service
curl -s https://api.example.com/api/customers \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20

# 5. Test health endpoints
curl https://api.example.com/actuator/health

# 6. Check all pods are healthy
kubectl get pods -n smartbiz
kubectl top pods -n smartbiz
```

### Step 28 — Check the Settings Page

Open `https://example.com/settings` in the browser — all three service health cards should show **Healthy** with green status.

---

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n smartbiz
kubectl logs <pod-name> -n smartbiz
```

### ALB not created after ingress apply
```bash
kubectl describe ingress smartbiz-ingress -n smartbiz
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### 502 Bad Gateway from ALB
```bash
# Check target group health in AWS Console → EC2 → Target Groups
# Or check pod readiness probes
kubectl get endpoints -n smartbiz
```

### MongoDB connection error in pod logs
```bash
# Verify the secret values are correct
kubectl get secret smartbiz-secrets -n smartbiz -o jsonpath='{.data.MONGO_URI_USERS}' | base64 -d
# Verify Atlas network access allows EKS node IPs
```

### CloudFront serving stale content
```bash
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

### CORS error in browser
- Verify `api.example.com` is in `allowedOrigins` in all three `SecurityConfig.java` files
- Check the ALB ingress CORS annotations in `k8s/ingress.yaml`
- Redeploy backend after any CORS changes

---

## Summary — Domain Routing

![Full Stack Production Architecture](./SmartBiz%20ERP%20Full%20Stack%20Production%20Architecture%20Diagram.png)

```
User Browser
    │
    ├── https://example.com          → Route53 A alias → CloudFront → S3 (React app)
    │
    └── https://api.example.com      → Route53 A alias → ALB
                                           │
                                           ├── /api/auth/*        → user-service pod
                                           ├── /api/users/*       → user-service pod
                                           ├── /api/employees/*   → user-service pod
                                           ├── /api/departments/* → user-service pod
                                           ├── /api/products/*    → inventory-service pod
                                           ├── /api/categories/*  → inventory-service pod
                                           ├── /api/suppliers/*   → inventory-service pod
                                           ├── /api/purchases/*   → inventory-service pod
                                           ├── /api/stock/*       → inventory-service pod
                                           ├── /api/customers/*   → sales-service pod
                                           ├── /api/orders/*      → sales-service pod
                                           ├── /api/invoices/*    → sales-service pod
                                           └── /api/payments/*    → sales-service pod
```

---

## Quick Reference — Useful Commands

```bash
# ── Cluster ───────────────────────────────────────────────────────────────
kubectl get nodes -o wide
kubectl get pods -n smartbiz -o wide
kubectl get ingress -n smartbiz

# ── Logs ──────────────────────────────────────────────────────────────────
kubectl logs -f deployment/user-service -n smartbiz
kubectl logs -f deployment/inventory-service -n smartbiz
kubectl logs -f deployment/sales-service -n smartbiz

# ── Scale ─────────────────────────────────────────────────────────────────
kubectl scale deployment/user-service --replicas=3 -n smartbiz

# ── Rollback ──────────────────────────────────────────────────────────────
kubectl rollout undo deployment/user-service -n smartbiz

# ── Update kubeconfig ─────────────────────────────────────────────────────
aws eks update-kubeconfig --name eks-dev --region us-east-1

# ── Destroy environments (via Jenkins — preferred) ────────────────────────
# Run each pipeline with ACTION=destroy in this order:
#   1. smartbiz-eks-infra       ENVIRONMENT=dev  ACTION=destroy
#   2. smartbiz-frontend-infra  ENVIRONMENT=dev  ACTION=destroy

# ── Destroy environments (manual fallback) ────────────────────────────────
cd infra/backend/terraform/envs/dev
terraform plan -destroy -out=tfplan.binary
terraform apply tfplan.binary

cd infra/frontend/terraform/envs/dev
terraform plan -destroy -out=tfplan.binary
terraform apply tfplan.binary
```
