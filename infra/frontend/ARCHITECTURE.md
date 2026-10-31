# Frontend Infrastructure — Architecture & Developer Notes

## Overview

The ERP frontend is a static site (React / Vue / plain HTML) hosted on **S3**, served globally via **CloudFront** (CDN), secured with an **ACM TLS certificate**, and reached through a custom domain managed in **Route53**.

The same three Terraform modules (`s3`, `acm`, `cdn`) are reused across **dev**, **stage**, and **prod**. Only the variable values change per environment.

---

## Architecture Diagram

![Frontend Infrastructure](./Frontend%20Infrastructure%20Architecture%20Diagram.png)

---

## Directory Structure

```
infra/frontend/
├── Jenkinsfile                           ← Parameterised pipeline
├── ARCHITECTURE.md                       ← This file
└── terraform/
    ├── modules/
    │   ├── s3/
    │   │   ├── main.tf                   ← Private bucket, versioning, OAC policy
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   ├── acm/
    │   │   ├── main.tf                   ← Certificate request + DNS validation
    │   │   ├── variables.tf
    │   │   ├── outputs.tf
    │   │   └── providers.tf              ← Forces us-east-1 provider
    │   └── cdn/
    │       ├── main.tf                   ← OAC, CloudFront distribution, R53 records
    │       ├── variables.tf
    │       └── outputs.tf
    └── envs/
        ├── dev/
        │   ├── main.tf                   ← S3 backend key: frontend/dev/ + OAC bucket policy
        │   ├── variables.tf
        │   ├── outputs.tf
        │   └── terraform.tfvars          ← dev.erp.example.com
        ├── stage/
        │   ├── main.tf                   ← S3 backend key: frontend/stage/ + OAC bucket policy
        │   ├── variables.tf
        │   ├── outputs.tf
        │   └── terraform.tfvars
        └── prod/
            ├── main.tf                   ← S3 backend key: frontend/prod/ + OAC bucket policy
            ├── variables.tf
            ├── outputs.tf
            └── terraform.tfvars
```

---

## Modules

### `modules/s3`

| Resource | Purpose |
|---|---|
| `aws_s3_bucket` | Holds the built frontend files |
| `aws_s3_bucket_public_access_block` | Blocks all public access — only OAC can read |
| `aws_s3_bucket_versioning` | Keeps previous file versions for rollback |
| `aws_s3_bucket_server_side_encryption_configuration` | AES-256 encryption at rest |

**Key design note — why the OAC bucket policy is NOT in this module:**  
The bucket policy needs the CloudFront distribution ARN, and CloudFront needs the S3 bucket domain name. Putting the policy inside the s3 module would create a circular dependency (`s3 → cdn → s3`). Instead, the `aws_s3_bucket_policy` resource lives directly in each env root (`envs/*/main.tf`) where both values are available after their respective modules run. Terraform resolves the graph automatically.

---

### `modules/acm`

| Resource | Purpose |
|---|---|
| `aws_acm_certificate` | TLS certificate for the domain + `www.*` SAN |
| `aws_route53_record` (for_each) | DNS CNAME validation records |
| `aws_acm_certificate_validation` | Blocks apply until ACM marks cert as ISSUED |

**Key design note:** CloudFront only accepts ACM certificates from **us-east-1**. The root module passes an aliased `aws.us_east_1` provider into this module so it always creates the cert in the right region, regardless of your primary region.

---

### `modules/cdn`

| Resource | Purpose |
|---|---|
| `aws_cloudfront_origin_access_control` | Signed SigV4 OAC — modern replacement for OAI |
| `aws_cloudfront_distribution` | Global CDN, HTTPS-only, SPA error handling |
| `aws_route53_record` (apex) | A alias for `erp.example.com` → CloudFront |
| `aws_route53_record` (www) | A alias for `www.erp.example.com` → CloudFront |

**SPA routing:** CloudFront is configured to catch 403 and 404 errors from S3 (which happen when a user refreshes on a deep route like `/dashboard`) and return `index.html` with a 200 status. This lets the client-side router handle the URL.

**Cache policy:** Uses the AWS-managed `CachingOptimized` policy (ID `658327ea-…`), which is the recommended default for S3 origins.

---

## Environments

| Setting | dev | stage | prod |
|---|---|---|---|
| Domain | `dev.erp.example.com` | `stage.erp.example.com` | `erp.example.com` |
| S3 bucket | `erp-frontend-dev` | `erp-frontend-stage` | `erp-frontend-prod` |
| State key | `frontend/dev/` | `frontend/stage/` | `frontend/prod/` |
| CloudFront price class | `PriceClass_100` | `PriceClass_100` | `PriceClass_100` |

---

## Remote State

Uses the **same S3 bucket and DynamoDB table** as the EKS backend infra. State keys are different so they never collide:

```
terraform-state-erp-project/
  eks/dev/terraform.tfstate
  eks/stage/terraform.tfstate
  eks/prod/terraform.tfstate
  frontend/dev/terraform.tfstate        ← this project
  frontend/stage/terraform.tfstate
  frontend/prod/terraform.tfstate
```

If you haven't created the S3 bucket yet, see the bootstrap commands in `infra/backend/eks/ARCHITECTURE.md`.

---

## Deploying Frontend Code (after infra is up)

```bash
# 1. Build your frontend
npm run build        # outputs to dist/ or build/

# 2. Upload to S3
aws s3 sync dist/ s3://erp-frontend-dev --delete

# 3. Invalidate CloudFront cache so users get the new files immediately
aws cloudfront create-invalidation \
  --distribution-id <id from terraform output> \
  --paths "/*"
```

The `cloudfront_distribution_id` is printed by the Jenkins Output stage after every apply.

---

## Things to Change Before Using

1. **Domain name** — replace `erp.example.com` in all three `terraform.tfvars` files.
2. **hosted_zone_id** — replace `Z1234ABCDEFGHIJ` with your actual Route53 hosted zone ID. Find it with: `aws route53 list-hosted-zones`.
3. **S3 bucket names** — `erp-frontend-dev/stage/prod` must be globally unique. Change them if already taken.
4. **S3 state bucket name** — update `terraform-state-erp-project` in all three `envs/*/main.tf` backend blocks if you used a different name.
5. **Git repo URL** — update the `url` in the Jenkinsfile `Pull` stage.
