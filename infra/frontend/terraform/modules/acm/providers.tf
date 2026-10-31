# ── ACM Module — Provider Requirement ────────────────────────────────────
# Declares that this module requires an AWS provider to be passed in.
# The root module passes the us-east-1 aliased provider here because
# CloudFront certificates MUST reside in us-east-1.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
