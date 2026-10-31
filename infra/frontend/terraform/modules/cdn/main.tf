# ── CDN Module ────────────────────────────────────────────────────────────
# Provisions:
#   • CloudFront Origin Access Control (OAC)
#   • CloudFront distribution with S3 origin, HTTPS redirect, custom domain
#   • Route53 A alias record pointing the custom domain at CloudFront

# ── Origin Access Control ──────────────────────────────────────────────────
# OAC is the modern replacement for OAI. It signs requests to S3 using
# SigV4 so the bucket can verify requests came from this distribution only.
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.bucket_name}-oac"
  description                       = "OAC for ${var.environment} frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"   # sign every request to S3
  signing_protocol                  = "sigv4"
}

# ── CloudFront Distribution ────────────────────────────────────────────────
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"   # served when the root URL is requested
  price_class         = "PriceClass_100" # US/Europe/Canada edge nodes only — cheapest tier
  aliases             = [var.domain_name, "www.${var.domain_name}"]

  # ── S3 Origin ─────────────────────────────────────────────────────────
  origin {
    origin_id                = "s3-${var.bucket_name}"
    domain_name              = var.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # ── Default Cache Behaviour ───────────────────────────────────────────
  # Redirects HTTP to HTTPS. Uses the AWS-managed CachingOptimized policy
  # which caches based on query strings and headers used by S3.
  default_cache_behavior {
    target_origin_id       = "s3-${var.bucket_name}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true   # gzip/brotli compression at the edge

    # AWS managed policy: CachingOptimized (recommended for S3 origins)
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  # ── SPA Error Handling ────────────────────────────────────────────────
  # Single-page apps (React/Vue/etc.) use client-side routing. When a user
  # refreshes on /dashboard, S3 returns a 403 (no such key). CloudFront
  # catches it and serves index.html with a 200 so the SPA router takes over.
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

  # ── TLS / HTTPS ───────────────────────────────────────────────────────
  # sni_only = false would require dedicated IP ($600/month) — always use SNI.
  # TLSv1.2_2021 is the minimum recommended version as of 2024.
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # ── Geo restrictions ──────────────────────────────────────────────────
  # No restrictions — serve globally. Change to whitelist if needed.
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name        = "${var.environment}-frontend-cdn"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ── Route53 — Apex domain A alias record ─────────────────────────────────
# Alias records are preferred over CNAMEs for apex domains (no subdomain).
# Both apex and www point to the same CloudFront distribution.
resource "aws_route53_record" "frontend_apex" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

# ── Route53 — www subdomain A alias record ────────────────────────────────
resource "aws_route53_record" "frontend_www" {
  zone_id = var.hosted_zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
