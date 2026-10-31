# ── EKS Module — Outputs ──────────────────────────────────────────────────
# Bubble up key cluster details to the root module so they can be printed
# at the end of a Jenkins run or used by downstream automation.

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "HTTPS endpoint for the EKS API server"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_version" {
  description = "Kubernetes version running on the control plane"
  value       = aws_eks_cluster.main.version
}

output "configure_kubectl" {
  description = "Copy-paste command to point kubectl at this cluster"
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.main.name} --region ${var.aws_region}"
}

output "eks_addons" {
  description = "Map of default addons installed on the cluster"
  value = {
    vpc_cni            = aws_eks_addon.vpc_cni.addon_name
    coredns            = aws_eks_addon.coredns.addon_name
    kube_proxy         = aws_eks_addon.kube_proxy.addon_name
    pod_identity_agent = aws_eks_addon.pod_identity_agent.addon_name
  }
}
