# ── Prod Frontend — Root Module ───────────────────────────────────────────
# Production frontend. use_custom_domain = true recommended for prod
# so users access via your real domain. Set to false for a quick deploy
# using the default *.cloudfront.net URL.

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "terraform-state-erp-project"
    key            = "frontend/prod/terraform.tfstate"
    region         = "us-east-1"
    use_lockfile    = true
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

module "s3" {
  source      = "../../modules/s3"
  bucket_name = var.bucket_name
  environment = var.environment
}

module "acm" {
  source = "../../modules/acm"
  count  = var.use_custom_domain ? 1 : 0

  providers = { aws = aws.us_east_1 }

  domain_name    = var.domain_name
  hosted_zone_id = var.hosted_zone_id
  environment    = var.environment
}

module "cdn" {
  source = "../../modules/cdn"

  environment                 = var.environment
  bucket_name                 = var.bucket_name
  bucket_regional_domain_name = module.s3.bucket_regional_domain_name
  use_custom_domain           = var.use_custom_domain
  domain_name                 = var.domain_name
  certificate_arn             = var.use_custom_domain ? module.acm[0].certificate_arn : ""
  hosted_zone_id              = var.hosted_zone_id
}

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
