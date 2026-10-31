# ── CDN Module — Outputs ──────────────────────────────────────────────────

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — use for cache invalidation after deploys"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN — used in the S3 OAC bucket policy"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "cloudfront_domain_name" {
  description = "The *.cloudfront.net domain. When use_custom_domain=false this IS your frontend URL."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "website_url" {
  description = "Frontend URL — custom domain if use_custom_domain=true, else *.cloudfront.net"
  value       = var.use_custom_domain ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend.domain_name}"
}
