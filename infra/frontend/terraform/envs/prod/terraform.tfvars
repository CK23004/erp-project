# ── Prod Frontend — Variable Values ──────────────────────────────────────
# Default: no custom domain — frontend served from *.cloudfront.net URL.
# For production with a real domain, switch use_custom_domain to true.

aws_region        = "us-east-1"
environment       = "prod"
bucket_name       = "smartbiz-frontend-prod-200774432801"

# ── No-domain mode (default) ──────────────────────────────────────────────
use_custom_domain = false

# ── Custom domain mode — uncomment and fill when use_custom_domain = true ─
# use_custom_domain = true
# domain_name       = "example.com"      # apex domain
# hosted_zone_id    = "Z1234ABCDEFGHIJ"
