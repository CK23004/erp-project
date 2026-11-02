# ── Dev Environment — Root Module ─────────────────────────────────────────
# This file wires the three modules together for the DEV environment.
# Values come from terraform.tfvars in this same folder.
# Remote state is stored in S3 under the key  eks/dev/terraform.tfstate
# so it is isolated from stage and prod state files.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ── Remote State Backend (S3 + DynamoDB lock) ─────────────────────────
  # S3 bucket and DynamoDB table must exist before running terraform init.
  # Create them once manually (or via a bootstrap script) then enable this.
  backend "s3" {
    bucket         = "terraform-state-erp-project"   # change to your bucket name
    key            = "eks/dev/terraform.tfstate"
    region         = "us-east-1"
    use_lockfile    = true
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# ── VPC Module ────────────────────────────────────────────────────────────
# Builds the VPC, 2 public subnets, IGW and route table for dev.
module "vpc" {
  source       = "../../modules/vpc"
  cluster_name = var.cluster_name
  vpc_cidr     = var.vpc_cidr
}

# ── IAM Module ────────────────────────────────────────────────────────────
# Creates the cluster role and node role scoped to the dev cluster name.
module "iam" {
  source       = "../../modules/iam"
  cluster_name = var.cluster_name
}

# ── EKS Module ────────────────────────────────────────────────────────────
# Provisions the control plane, node group, and default addons.
# Subnet IDs and role ARNs are wired in from the vpc and iam modules above.
module "eks" {
  source = "../../modules/eks"

  cluster_name     = var.cluster_name
  aws_region       = var.aws_region
  cluster_role_arn = module.iam.cluster_role_arn
  node_role_arn    = module.iam.node_role_arn
  subnet_ids       = module.vpc.public_subnet_ids

  node_instance_type = var.node_instance_type
  desired_nodes      = var.desired_nodes
  min_nodes          = var.min_nodes
  max_nodes          = var.max_nodes
}
