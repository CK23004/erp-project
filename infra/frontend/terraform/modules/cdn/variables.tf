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

# ── Custom domain variables — only required when use_custom_domain = true ──
variable "use_custom_domain" {
  description = "Set to true to use a custom domain + ACM cert. Set to false to use the default *.cloudfront.net URL (no domain, no cert needed)."
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Custom domain for the CloudFront distribution. Only used when use_custom_domain = true."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1). Only used when use_custom_domain = true."
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID. Only used when use_custom_domain = true."
  type        = string
  default     = ""
}
