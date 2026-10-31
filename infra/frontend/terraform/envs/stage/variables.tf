# ── Stage Frontend — Variable Declarations ────────────────────────────────

variable "aws_region" {
  description = "Primary AWS region for S3 and Route53"
  type        = string
}

variable "environment" {
  description = "Environment label — dev / stage / prod"
  type        = string
}

variable "bucket_name" {
  description = "Globally unique S3 bucket name for frontend static files"
  type        = string
}

variable "domain_name" {
  description = "Custom domain for this environment (e.g. stage.erp.example.com)"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the root domain"
  type        = string
}
