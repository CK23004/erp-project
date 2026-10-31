# ── EKS Module ────────────────────────────────────────────────────────────
# Provisions:
#   • EKS control plane
#   • Managed node group (auto-scaling)
#   • Four default addons: vpc-cni, coredns, kube-proxy, pod-identity-agent
#
# All resource names are prefixed with cluster_name so dev/stage/prod
# can coexist in the same AWS account without name collisions.

# ── EKS Control Plane ─────────────────────────────────────────────────────
# Both public and private endpoint access are enabled:
#   - public  → allows kubectl from a developer laptop
#   - private → allows in-cluster traffic (node-to-API) to stay inside the VPC
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = var.cluster_role_arn
  version  = "1.37"

  vpc_config {
    subnet_ids              = var.subnet_ids
    endpoint_public_access  = true
    endpoint_private_access = true
  }

  # The cluster role policy must exist before the cluster can be created.
  depends_on = [var.cluster_role_arn]

  tags = {
    Name = var.cluster_name
  }
}

# ── Managed Node Group ────────────────────────────────────────────────────
# Uses AWS managed node groups so OS patching and node lifecycle are handled
# by AWS. desired/min/max are controlled per environment via tfvars.
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-ng"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.subnet_ids

  instance_types = [var.node_instance_type]

  scaling_config {
    desired_size = var.desired_nodes
    min_size     = var.min_nodes
    max_size     = var.max_nodes
  }

  # max_unavailable = 1 means at most one node is replaced at a time during
  # updates, keeping the cluster available throughout the rollout.
  update_config {
    max_unavailable = 1
  }

  # Node role policies must all be attached before nodes can join the cluster.
  depends_on = [var.node_role_arn]

  tags = {
    Name = "${var.cluster_name}-ng"
  }
}

# ── Default EKS Addons ────────────────────────────────────────────────────
# All four addons are required for a functional cluster.
# OVERWRITE on conflicts lets Terraform manage addon versions without getting
# blocked by manual changes made via the console.

# vpc-cni: assigns VPC IPs directly to pods (native VPC networking).
resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "vpc-cni"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
  depends_on                  = [aws_eks_node_group.main]
  tags                        = { Name = "${var.cluster_name}-vpc-cni" }
}

# coredns: in-cluster DNS resolution for service discovery.
resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "coredns"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
  depends_on                  = [aws_eks_node_group.main]
  tags                        = { Name = "${var.cluster_name}-coredns" }
}

# kube-proxy: manages iptables rules for Service networking on each node.
resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "kube-proxy"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
  depends_on                  = [aws_eks_node_group.main]
  tags                        = { Name = "${var.cluster_name}-kube-proxy" }
}

# eks-pod-identity-agent: enables IAM Roles for Service Accounts (IRSA v2).
resource "aws_eks_addon" "pod_identity_agent" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "eks-pod-identity-agent"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
  depends_on                  = [aws_eks_node_group.main]
  tags                        = { Name = "${var.cluster_name}-pod-identity-agent" }
}
