# ── Stage Frontend — Variable Declarations ────────────────────────────────

variable "aws_region" {
  type = string
}

variable "environment" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "use_custom_domain" {
  description = "false = *.cloudfront.net URL. true = custom domain + ACM + Route53."
  type        = bool
  default     = false
}

variable "domain_name" {
  type    = string
  default = ""
}

variable "hosted_zone_id" {
  type    = string
  default = ""
}
