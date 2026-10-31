# ── IAM Module ────────────────────────────────────────────────────────────
# Creates two IAM roles with the minimum AWS-managed policies needed by EKS:
#   1. Cluster role  — assumed by the EKS control plane (eks.amazonaws.com)
#   2. Node role     — assumed by EC2 worker nodes (ec2.amazonaws.com)
#
# The cluster_name prefix ensures role names are unique per environment so
# dev/stage/prod can coexist in the same AWS account.

# ── EKS Control Plane Role ────────────────────────────────────────────────
# The EKS service needs this role to manage AWS resources on your behalf
# (security groups, ENIs, etc.).
resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
}

# AmazonEKSClusterPolicy gives the control plane permission to call AWS APIs.
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

# ── EKS Node Group Role ───────────────────────────────────────────────────
# Worker nodes (EC2 instances) assume this role to join the cluster,
# pull container images from ECR, and set up pod networking via the CNI.
resource "aws_iam_role" "eks_nodes" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

# Required: lets nodes register with the cluster and report health.
resource "aws_iam_role_policy_attachment" "eks_worker_node" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

# Required: gives the VPC CNI plugin permission to manage ENIs.
resource "aws_iam_role_policy_attachment" "eks_cni" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

# Required: allows nodes to pull images from any ECR repo in the account.
resource "aws_iam_role_policy_attachment" "eks_ecr" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}
