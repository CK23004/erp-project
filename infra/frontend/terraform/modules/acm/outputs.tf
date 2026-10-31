# ── ACM Module — Outputs ──────────────────────────────────────────────────

output "certificate_arn" {
  description = "ARN of the validated ACM certificate — attached to the CloudFront distribution"
  value       = aws_acm_certificate_validation.frontend.certificate_arn
}
