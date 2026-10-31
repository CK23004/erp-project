# ── CDN Module ────────────────────────────────────────────────────────────
# Provisions CloudFront + optionally Route53 records.
#
# Two modes controlled by var.use_custom_domain:
#
#   false (default) — No custom domain, no ACM cert, no Route53.
#     Frontend URL: https://<random-id>.cloudfront.net
#     Use this for quick deploys, dev environments, or when you don't own a domain.
#
#   true — Custom domain + ACM cert + Route53 A alias records.
#     Frontend URL: https://<your-domain>
#     Requires: domain_name, certificate_arn, hosted_zone_id variables set.

# ── Origin Access Control ──────────────────────────────────────────────────
# OAC signs every request to S3 with SigV4 so the bucket stays private.
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.bucket_name}-oac"
  description                       = "OAC for ${var.environment} frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── CloudFront Distribution ────────────────────────────────────────────────
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  # When use_custom_domain = true, set the aliases so CloudFront accepts
  # requests for your domain. When false, leave empty — CloudFront assigns
  # its own *.cloudfront.net domain automatically.
  aliases = var.use_custom_domain ? [var.domain_name, "www.${var.domain_name}"] : []

  origin {
    origin_id                = "s3-${var.bucket_name}"
    domain_name              = var.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${var.bucket_name}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    # AWS managed CachingOptimized policy — recommended for S3 origins
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  # SPA routing — S3 returns 403 for deep routes, CloudFront catches and
  # serves index.html so the React Router can handle the URL client-side.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  # ── TLS Certificate ───────────────────────────────────────────────────
  # use_custom_domain = false → use the free default CloudFront cert
  #   (covers *.cloudfront.net automatically, no setup needed)
  # use_custom_domain = true  → use the provided ACM cert
  viewer_certificate {
    cloudfront_default_certificate = var.use_custom_domain ? false : true
    acm_certificate_arn            = var.use_custom_domain ? var.certificate_arn : null
    ssl_support_method             = var.use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = var.use_custom_domain ? "TLSv1.2_2021" : null
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  tags = {
    Name        = "${var.environment}-frontend-cdn"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ── Route53 records — only created when use_custom_domain = true ──────────
# count = 0 means the resource is not created at all in no-domain mode.
resource "aws_route53_record" "frontend_apex" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_www" {
  count   = var.use_custom_domain ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
