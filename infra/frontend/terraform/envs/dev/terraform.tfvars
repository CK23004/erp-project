# ── Dev Frontend — Variable Values ───────────────────────────────────────
# Replace hosted_zone_id with your actual Route53 hosted zone ID.
# The hosted zone must already exist (created manually or via a separate
# Terraform run) before applying this configuration.

aws_region     = "us-east-1"
environment    = "dev"
bucket_name    = "erp-frontend-dev"               # must be globally unique — change if taken
domain_name    = "dev.cloudblitz-in.work.gd"            # change to your actual domain
hosted_zone_id = "Z086628638YE1AZNQOT5G"                # change to your Route53 hosted zone ID
