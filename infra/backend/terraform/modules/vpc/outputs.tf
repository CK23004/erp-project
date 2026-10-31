# ── VPC Module — Outputs ──────────────────────────────────────────────────
# These values are consumed by the iam and eks modules via the root module.

output "vpc_id" {
  description = "ID of the EKS VPC — passed to the EKS module vpc_config"
  value       = aws_vpc.eks.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs across 2 AZs — used by EKS node groups"
  value       = aws_subnet.public[*].id
}
