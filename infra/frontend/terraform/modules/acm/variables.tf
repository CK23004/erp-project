# ── ACM Module — Input Variables ──────────────────────────────────────────
# ACM certificates used by CloudFront MUST be created in us-east-1 regardless
# of where the rest of your infra lives. This module is always deployed to
# us-east-1 via an aliased provider passed in from the root module.

variable "domain_name" {
  description = "Primary domain for the certificate (e.g. erp.example.com)"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain — used for DNS validation records"
  type        = string
}

variable "environment" {
  description = "Environment label used in tags"
  type        = string
}
