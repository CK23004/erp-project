# ── ACM Module ────────────────────────────────────────────────────────────
# Requests a public TLS certificate and validates it via DNS (Route53).
#
# IMPORTANT: CloudFront requires ACM certificates to exist in us-east-1.
# The root module passes an aws provider aliased to us-east-1 so this module
# works correctly even if your primary region is different.

# ── TLS Certificate Request ────────────────────────────────────────────────
# DNS validation is preferred over email validation because it is fully
# automatable — Terraform creates the validation DNS record in Route53
# and ACM polls for it automatically.
resource "aws_acm_certificate" "frontend" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  # Subject Alternative Name covers the www subdomain as well.
  # e.g.  dev.erp.example.com  and  www.dev.erp.example.com
  subject_alternative_names = ["www.${var.domain_name}"]

  # create_before_destroy ensures a new certificate is fully validated before
  # the old one is destroyed during a replacement (e.g. domain name change).
  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.domain_name}-cert"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ── DNS Validation Records in Route53 ─────────────────────────────────────
# ACM provides one CNAME record per domain name in the certificate.
# for_each iterates over the set of domain_validation_options so both the
# apex domain and the www SAN get their validation CNAMEs created.
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = var.hosted_zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60

  # allow_overwrite = true prevents errors if the record already exists
  # (e.g. re-running apply after a partial failure).
  allow_overwrite = true
}

# ── Wait for certificate validation ───────────────────────────────────────
# Terraform blocks here until ACM marks the certificate as ISSUED.
# CloudFront can only attach a certificate in ISSUED state.
resource "aws_acm_certificate_validation" "frontend" {
  certificate_arn         = aws_acm_certificate.frontend.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}
