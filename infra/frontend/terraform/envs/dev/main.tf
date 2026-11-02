# ── Dev Frontend — Root Module ────────────────────────────────────────────
# Supports two modes via use_custom_domain variable:
#
#   use_custom_domain = false (default)
#     → S3 + CloudFront only. No ACM, no Route53.
#     → Frontend URL: https://<id>.cloudfront.net  (from terraform output website_url)
#     → Set this in terraform.tfvars — no other changes needed.
#
#   use_custom_domain = true
#     → S3 + CloudFront + ACM cert + Route53 A alias records.
#     → Frontend URL: https://<domain_name>
#     → Requires: domain_name, hosted_zone_id set in terraform.tfvars

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "terraform-state-erp-project"
    key            = "frontend/dev/terraform.tfstate"
    region         = "us-east-1"
    use_lockfile    = true
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# us-east-1 alias — needed only when use_custom_domain = true (ACM must be in us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# ── S3 Module ─────────────────────────────────────────────────────────────
module "s3" {
  source      = "../../modules/s3"
  bucket_name = var.bucket_name
  environment = var.environment
}

# ── ACM Module — only created when use_custom_domain = true ───────────────
# count = 0 skips the module entirely in no-domain mode.
module "acm" {
  source = "../../modules/acm"
  count  = var.use_custom_domain ? 1 : 0

  providers = { aws = aws.us_east_1 }

  domain_name    = var.domain_name
  hosted_zone_id = var.hosted_zone_id
  environment    = var.environment
}

# ── CDN Module ────────────────────────────────────────────────────────────
module "cdn" {
  source = "../../modules/cdn"

  environment                 = var.environment
  bucket_name                 = var.bucket_name
  bucket_regional_domain_name = module.s3.bucket_regional_domain_name
  use_custom_domain           = var.use_custom_domain

  # These are only used when use_custom_domain = true
  domain_name     = var.domain_name
  certificate_arn = var.use_custom_domain ? module.acm[0].certificate_arn : ""
  hosted_zone_id  = var.hosted_zone_id
}

# ── OAC Bucket Policy ─────────────────────────────────────────────────────
# Grants only this CloudFront distribution access to the private S3 bucket.
resource "aws_s3_bucket_policy" "oac" {
  bucket     = module.s3.bucket_name
  depends_on = [module.s3]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${module.s3.bucket_arn}/*"
      Condition = { StringEquals = { "AWS:SourceArn" = module.cdn.cloudfront_distribution_arn } }
    }]
  })
}
