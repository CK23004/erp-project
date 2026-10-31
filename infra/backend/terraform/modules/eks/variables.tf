# ── EKS Module — Input Variables ─────────────────────────────────────────
# All cluster and node group configuration is passed in from the env layer.
# Keeping defaults-free here forces each environment to be explicit.

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "cluster_role_arn" {
  description = "IAM role ARN for the EKS control plane (from iam module)"
  type        = string
}

variable "node_role_arn" {
  description = "IAM role ARN for worker nodes (from iam module)"
  type        = string
}

variable "subnet_ids" {
  description = "List of public subnet IDs for the cluster and node group (from vpc module)"
  type        = list(string)
}

variable "node_instance_type" {
  description = "EC2 instance type for worker nodes — use smaller types in dev to save cost"
  type        = string
}

variable "desired_nodes" {
  description = "Desired number of worker nodes in the auto-scaling group"
  type        = number
}

variable "min_nodes" {
  description = "Minimum number of worker nodes — cluster will not scale below this"
  type        = number
}

variable "max_nodes" {
  description = "Maximum number of worker nodes — cluster will not scale above this"
  type        = number
}

variable "aws_region" {
  description = "AWS region — used to build the kubeconfig output command"
  type        = string
}
