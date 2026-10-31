# ── CDN Module — Input Variables ──────────────────────────────────────────

variable "environment" {
  description = "Environment label (dev / stage / prod)"
  type        = string
}

variable "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 origin bucket (from s3 module output)"
  type        = string
}

variable "bucket_name" {
  description = "S3 bucket name — used to name the OAC"
  type        = string
}

variable "domain_name" {
  description = "Custom domain for the CloudFront distribution (e.g. dev.erp.example.com)"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1) — from acm module output"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID — used to create the A alias record pointing to CloudFront"
  type        = string
}
