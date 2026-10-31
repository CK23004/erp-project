# ── S3 Module — Outputs ───────────────────────────────────────────────────

output "bucket_name" {
  description = "Name of the S3 bucket — used in the OAC bucket policy in the root module"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket — used in the OAC bucket policy Resource field"
  value       = aws_s3_bucket.frontend.arn
}

output "bucket_regional_domain_name" {
  description = "Regional domain passed to CloudFront as the S3 origin (e.g. bucket.s3.us-east-1.amazonaws.com)"
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}

output "public_access_block_id" {
  description = "Used as depends_on in the root OAC policy to ensure block is applied first"
  value       = aws_s3_bucket_public_access_block.frontend.id
}
