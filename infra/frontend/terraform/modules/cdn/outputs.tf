# ── CDN Module — Outputs ──────────────────────────────────────────────────

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — needed to run cache invalidations after deploys"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN — used in the S3 bucket OAC policy condition"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "cloudfront_domain_name" {
  description = "The *.cloudfront.net domain assigned to this distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "website_url" {
  description = "Full HTTPS URL for the frontend"
  value       = "https://${var.domain_name}"
}
