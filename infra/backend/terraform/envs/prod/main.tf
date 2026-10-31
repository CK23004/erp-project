# ── Prod Environment — Root Module ────────────────────────────────────────
# Production cluster. State is isolated under  eks/prod/terraform.tfstate.
# Always review the plan carefully before applying to prod.
# Consider enabling additional controls like Sentinel/OPA policies here.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ── Remote State Backend ──────────────────────────────────────────────
  backend "s3" {
    bucket         = "terraform-state-erp-project"   # change to your bucket name
    key            = "eks/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# ── VPC Module ────────────────────────────────────────────────────────────
module "vpc" {
  source       = "../../modules/vpc"
  cluster_name = var.cluster_name
  vpc_cidr     = var.vpc_cidr
}

# ── IAM Module ────────────────────────────────────────────────────────────
module "iam" {
  source       = "../../modules/iam"
  cluster_name = var.cluster_name
}

# ── EKS Module ────────────────────────────────────────────────────────────
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
