# ── S3 Module ─────────────────────────────────────────────────────────────
# Creates the private S3 bucket that holds built frontend files.
# The bucket is PRIVATE — CloudFront accesses it via Origin Access Control
# (OAC). The OAC bucket policy is applied in the root module (envs/*/main.tf)
# rather than here, because the policy needs the CloudFront distribution ARN
# which is only known after the cdn module runs. Putting it here would create
# a circular dependency: s3 needs cdn ARN, cdn needs s3 domain name.

# ── S3 Bucket ─────────────────────────────────────────────────────────────
# force_destroy = true so terraform destroy can empty and delete the bucket
# without manual intervention. Set to false in prod if you want extra safety.
resource "aws_s3_bucket" "frontend" {
  bucket        = var.bucket_name
  force_destroy = true

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ── Block all public access ────────────────────────────────────────────────
# Bucket stays private — all public access routes are blocked at the bucket level.
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Bucket versioning ──────────────────────────────────────────────────────
# Keeps previous versions of deployed files for quick rollback.
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ── Server-side encryption ─────────────────────────────────────────────────
# AES-256 encryption at rest for all objects.
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
