# ── Prod Frontend — Variable Values ──────────────────────────────────────
# Prod uses the apex domain (no subdomain prefix).

aws_region     = "us-east-1"
environment    = "prod"
bucket_name    = "erp-frontend-prod"
domain_name    = "cloudblitz-in.work.gd"                    # apex domain — frontend lives here
hosted_zone_id = "Z086628638YE1AZNQOT5G"                # change to your Route53 hosted zone ID
