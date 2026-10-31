# ── Dev Frontend — Root Module ────────────────────────────────────────────
# Wires the s3, acm, and cdn modules for DEV, and attaches the OAC bucket
# policy here (not inside the s3 module) to avoid a circular dependency:
#
#   cdn needs → s3.bucket_regional_domain_name   (to define the origin)
#   s3 needs  → cdn.cloudfront_distribution_arn  (to scope the bucket policy)
#
# Solution: s3 module creates the bucket only. The bucket policy resource
# lives here in the root where both values are available without a cycle.
#
# Dependency graph (resolved by Terraform):
#   acm → (certificate_arn) → cdn → (distribution_arn) → aws_s3_bucket_policy
#                                 ↑
#   s3  → (bucket domain)   ──────┘

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ── Remote State Backend ──────────────────────────────────────────────
  # Same S3 bucket as EKS infra — different key keeps state isolated.
  backend "s3" {
    bucket         = "terraform-state-erp-project"   # change to your bucket name
    key            = "frontend/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

# ── Primary provider ──────────────────────────────────────────────────────
provider "aws" {
  region = var.aws_region
}

# ── us-east-1 alias — required for ACM certificates used by CloudFront ────
# CloudFront only accepts ACM certs from us-east-1, regardless of where
# your other resources live.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# ── S3 Module — bucket only (no OAC policy yet) ───────────────────────────
# Creates the private bucket with versioning and encryption.
# OAC policy is applied below after CloudFront ARN is known.
module "s3" {
  source = "../../modules/s3"

  bucket_name = var.bucket_name
  environment = var.environment
}

# ── ACM Module — TLS certificate in us-east-1 ────────────────────────────
# Requests and DNS-validates a certificate for the domain + www.domain.
module "acm" {
  source = "../../modules/acm"

  providers = {
    aws = aws.us_east_1
  }

  domain_name    = var.domain_name
  hosted_zone_id = var.hosted_zone_id
  environment    = var.environment
}

# ── CDN Module — CloudFront + Route53 ────────────────────────────────────
# Depends on s3 (for origin domain) and acm (for certificate ARN).
# Terraform resolves both dependencies automatically.
module "cdn" {
  source = "../../modules/cdn"

  environment                 = var.environment
  bucket_name                 = var.bucket_name
  bucket_regional_domain_name = module.s3.bucket_regional_domain_name
  domain_name                 = var.domain_name
  certificate_arn             = module.acm.certificate_arn
  hosted_zone_id              = var.hosted_zone_id
}

# ── OAC Bucket Policy — applied after CloudFront ARN is known ─────────────
# This is the only resource that needs BOTH the S3 ARN and the CloudFront
# distribution ARN, so it lives here in the root to avoid a circular dep.
# The AWS:SourceArn condition ensures ONLY this distribution can read the bucket.
resource "aws_s3_bucket_policy" "oac" {
  bucket = module.s3.bucket_name

  # Wait for the public access block before attaching any policy.
  # Without this, AWS can briefly reject the policy during a race condition.
  depends_on = [module.s3]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${module.s3.bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = module.cdn.cloudfront_distribution_arn
          }
        }
      }
    ]
  })
}
