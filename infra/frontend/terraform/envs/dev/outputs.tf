# ── Dev Frontend — Outputs ────────────────────────────────────────────────

output "website_url" {
  description = "Live URL of the dev frontend"
  value       = module.cdn.website_url
}

output "cloudfront_distribution_id" {
  description = "Use this ID to invalidate the CloudFront cache after a deploy: aws cloudfront create-invalidation --distribution-id <id> --paths '/*'"
  value       = module.cdn.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "The raw *.cloudfront.net domain (useful for debugging)"
  value       = module.cdn.cloudfront_domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket to upload build artifacts to"
  value       = module.s3.bucket_name
}
