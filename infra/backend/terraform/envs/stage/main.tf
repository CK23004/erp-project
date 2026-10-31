# ── Stage Environment — Root Module ───────────────────────────────────────
# Identical structure to dev/main.tf — only the backend key and tfvars differ.
# Stage is used for integration/QA testing before promoting to prod.
# State is isolated under  eks/stage/terraform.tfstate  in the same S3 bucket.

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
    key            = "eks/stage/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    use_lockfile   = true
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
