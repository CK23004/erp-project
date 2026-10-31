# ── IAM Module — Outputs ──────────────────────────────────────────────────
# Role ARNs are consumed by the EKS module when creating the cluster
# and node group resources.

output "cluster_role_arn" {
  description = "ARN of the EKS control plane IAM role"
  value       = aws_iam_role.eks_cluster.arn
}

output "node_role_arn" {
  description = "ARN of the EKS worker node IAM role"
  value       = aws_iam_role.eks_nodes.arn
}

# Expose policy attachment names so the EKS module can express depends_on
# without coupling directly to the IAM role resource names.
output "cluster_policy_attachment_id" {
  description = "Used for depends_on in the EKS cluster resource"
  value       = aws_iam_role_policy_attachment.eks_cluster_policy.id
}

output "node_policy_attachment_ids" {
  description = "Used for depends_on in the EKS node group resource"
  value = [
    aws_iam_role_policy_attachment.eks_worker_node.id,
    aws_iam_role_policy_attachment.eks_cni.id,
    aws_iam_role_policy_attachment.eks_ecr.id,
  ]
}
