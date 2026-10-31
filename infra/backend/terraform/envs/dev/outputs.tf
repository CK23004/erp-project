# ── Dev Environment — Outputs ─────────────────────────────────────────────
# Pass module outputs up so they appear in the Jenkins "Output" stage.

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_version" {
  description = "Kubernetes version"
  value       = module.eks.cluster_version
}

output "configure_kubectl" {
  description = "Run this to configure kubectl locally"
  value       = module.eks.configure_kubectl
}

output "eks_addons" {
  description = "Installed EKS addons"
  value       = module.eks.eks_addons
}
