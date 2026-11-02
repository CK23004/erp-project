# ── Dev Frontend — Variable Values ───────────────────────────────────────
# MODE: no custom domain — frontend served from *.cloudfront.net URL
# After apply, run: terraform output website_url  to get the URL.
#
# To switch to custom domain mode:
#   1. Set use_custom_domain = true
#   2. Set domain_name and hosted_zone_id below
#   3. Run terraform apply

aws_region        = "us-east-1"
environment       = "dev"
bucket_name       = "smartbiz-frontend-dev-200774432801"   # account ID suffix guarantees global uniqueness

# ── No-domain mode (default) ──────────────────────────────────────────────
use_custom_domain = false
# domain_name    = ""    # not needed — leave blank
# hosted_zone_id = ""    # not needed — leave blank

# ── Custom domain mode — uncomment and fill when use_custom_domain = true ─
# use_custom_domain = true
# domain_name       = "dev.example.com"
# hosted_zone_id    = "Z1234ABCDEFGHIJ"
