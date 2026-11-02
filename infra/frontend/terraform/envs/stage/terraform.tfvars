# ── Stage Frontend — Variable Values ─────────────────────────────────────
# MODE: no custom domain — frontend served from *.cloudfront.net URL

aws_region        = "us-east-1"
environment       = "stage"
bucket_name       = "smartbiz-frontend-stage-200774432801"

# ── No-domain mode (default) ──────────────────────────────────────────────
use_custom_domain = false

# ── Custom domain mode — uncomment and fill when use_custom_domain = true ─
# use_custom_domain = true
# domain_name       = "stage.example.com"
# hosted_zone_id    = "Z1234ABCDEFGHIJ"
