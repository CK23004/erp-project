# ── Dev Frontend — Variable Declarations ─────────────────────────────────

variable "aws_region" {
  description = "AWS region"
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

variable "use_custom_domain" {
  description = "false = use default *.cloudfront.net URL (no domain needed). true = use custom domain + ACM + Route53."
  type        = bool
  default     = false
}

# The following three are only required when use_custom_domain = true.
# They have empty defaults so the plan does not fail in no-domain mode.
variable "domain_name" {
  description = "Custom domain (e.g. dev.example.com). Only used when use_custom_domain = true."
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID. Only used when use_custom_domain = true."
  type        = string
  default     = ""
}
