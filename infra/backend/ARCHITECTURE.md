# EKS Infrastructure — Architecture & Developer Notes

## Overview

This project provisions an AWS EKS cluster using Terraform with a **module-based, multi-environment** layout.  
The same three reusable modules (`vpc`, `iam`, `eks`) are shared across **dev**, **stage**, and **prod** — only the variable values differ per environment.  
A Jenkins pipeline drives the whole lifecycle with a single parameterised job: pick your environment, pick `apply` or `destroy`, and go.

---

## Architecture Diagram

![EKS Backend Infrastructure](./EKS%20Backend%20Infrastructure%20Diagram.png)

---

## Directory Structure

```
infra/backend/eks/
├── Jenkinsfile                         ← Parameterised pipeline (env + action)
├── ARCHITECTURE.md                     ← This file
└── terraform/
    ├── modules/                        ← Reusable, environment-agnostic modules
    │   ├── vpc/
    │   │   ├── main.tf                 ← VPC, subnets, IGW, route table
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   ├── iam/
    │   │   ├── main.tf                 ← Cluster role + Node role + policy attachments
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   └── eks/
    │       ├── main.tf                 ← EKS cluster, node group, 4 addons
    │       ├── variables.tf
    │       └── outputs.tf
    └── envs/                           ← One folder per environment
        ├── dev/
        │   ├── main.tf                 ← Calls all 3 modules, S3 backend key: eks/dev/
        │   ├── variables.tf
        │   ├── outputs.tf
        │   └── terraform.tfvars        ← t3.medium, 1 node, CIDR 10.0.0.0/16
        ├── stage/
        │   ├── main.tf                 ← S3 backend key: eks/stage/
        │   ├── variables.tf
        │   ├── outputs.tf
        │   └── terraform.tfvars        ← c7i-flex.large, 2 nodes, CIDR 10.1.0.0/16
        └── prod/
            ├── main.tf                 ← S3 backend key: eks/prod/
            ├── variables.tf
            ├── outputs.tf
            └── terraform.tfvars        ← c7i-flex.large, 2-4 nodes, CIDR 10.2.0.0/16
```

---

## Modules

### `modules/vpc`

| Resource | Purpose |
|---|---|
| `aws_vpc` | Main VPC with DNS support enabled (required by EKS) |
| `aws_subnet` (×2) | One public subnet per AZ — nodes get public IPs |
| `aws_internet_gateway` | Allows outbound internet access for nodes and ingress |
| `aws_route_table` | Single route table sending `0.0.0.0/0` to the IGW |
| `aws_route_table_association` | Binds each subnet to the route table |

**Key design notes:**
- `cidrsubnet(var.vpc_cidr, 8, count.index)` derives `/24` subnets automatically from the VPC CIDR, so you never hardcode subnet ranges.
- Each environment uses a different VPC CIDR (10.0/10.1/10.2) to avoid overlap if you ever peer them or run them in the same account.
- The Kubernetes cluster tag `kubernetes.io/cluster/<name> = shared` is required for EKS auto-discovery of the VPC and subnets.

---

### `modules/iam`

| Resource | Purpose |
|---|---|
| `aws_iam_role.eks_cluster` | Assumed by the EKS control plane service |
| `aws_iam_role.eks_nodes` | Assumed by EC2 worker node instances |
| `AmazonEKSClusterPolicy` | Lets EKS manage VPC/SG resources |
| `AmazonEKSWorkerNodePolicy` | Lets nodes register with the cluster |
| `AmazonEKS_CNI_Policy` | Lets the VPC CNI plugin manage ENIs |
| `AmazonEC2ContainerRegistryReadOnly` | Lets nodes pull images from ECR |

---

### `modules/eks`

| Resource | Purpose |
|---|---|
| `aws_eks_cluster` | EKS control plane — public + private endpoint |
| `aws_eks_node_group` | Managed node group with auto-scaling |
| `aws_eks_addon.vpc_cni` | Native VPC pod networking |
| `aws_eks_addon.coredns` | In-cluster DNS |
| `aws_eks_addon.kube_proxy` | iptables rules for Service networking |
| `aws_eks_addon.pod_identity_agent` | IRSA v2 / Pod Identity |

---

## Environments

| Setting | dev | stage | prod |
|---|---|---|---|
| Cluster name | `eks-dev` | `eks-stage` | `eks-prod` |
| VPC CIDR | `10.0.0.0/16` | `10.1.0.0/16` | `10.2.0.0/16` |
| Instance type | `t3.medium` | `c7i-flex.large` | `c7i-flex.large` |
| Desired nodes | 1 | 2 | 2 |
| Min nodes | 1 | 1 | 2 |
| Max nodes | 2 | 3 | 4 |
| State key | `eks/dev/` | `eks/stage/` | `eks/prod/` |

---

## Remote State Backend

All three environments share **one S3 bucket** but use **different state keys**, so state files never collide.  
A single DynamoDB table handles state locking across all three.

**Bootstrap (run once before first `terraform init`):**

```bash
# Create the S3 bucket
aws s3api create-bucket \
  --bucket terraform-state-erp-project \
  --region us-east-1

# Enable versioning so you can recover from accidental state corruption
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

---

## Jenkins Pipeline

The pipeline has **6 stages** and two parameters shown as dropdowns:

| Parameter | Options | Effect |
|---|---|---|
| `ENVIRONMENT` | `dev` / `stage` / `prod` | Sets `TF_DIR=terraform/envs/<env>` |
| `ACTION` | `apply` / `destroy` | Switches between `plan` and `plan -destroy` |

**Stage flow:**

```
Pull → Init → Plan → Approval (manual) → Execute → Output (apply only)
```

- The **Plan** stage archives `tfplan.txt` as a build artifact so reviewers can read it before approving.
- The **Approval** stage pauses for up to 30 minutes waiting for a human click.
- The **Execute** stage replays the saved binary plan file — it never re-plans, so exactly what was reviewed gets applied.
- The **Output** stage is skipped on destroy (resources are gone).

---

## How to Run Locally (without Jenkins)

```bash
# Target dev environment
cd terraform/envs/dev

terraform init
terraform plan -out=tfplan.binary
terraform apply tfplan.binary

# Destroy dev
terraform plan -destroy -out=tfplan.binary
terraform apply tfplan.binary
```

---

## Things to Change Before Using

1. **S3 bucket name** — replace `terraform-state-erp-project` in all three `envs/*/main.tf` backend blocks and in the bootstrap commands above with your actual bucket name.
2. **AWS region** — update `aws_region` in `terraform.tfvars` files if you use a different region.
3. **Git repo URL** — update the `url` in the Jenkinsfile `Pull` stage to point to your actual repo.
4. **Jenkins credential ID** — `aws-terraform-credentials` must match the credential you created in Jenkins → Manage Credentials.
