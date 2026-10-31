# ── S3 Module — Input Variables ───────────────────────────────────────────
# cloudfront_distribution_arn is intentionally NOT a variable here.
# The OAC bucket policy is handled in the root module to avoid a circular
# dependency (s3 needs cdn ARN, cdn needs s3 domain name).

variable "bucket_name" {
  description = "Globally unique S3 bucket name for the frontend static files"
  type        = string
}

variable "environment" {
  description = "Environment label (dev / stage / prod) used in tags"
  type        = string
}
