# ── Stage Frontend — Outputs ──────────────────────────────────────────────

output "website_url" {
  description = "Live URL of the stage frontend"
  value       = module.cdn.website_url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = module.cdn.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "Raw *.cloudfront.net domain"
  value       = module.cdn.cloudfront_domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket to upload build artifacts to"
  value       = module.s3.bucket_name
}
