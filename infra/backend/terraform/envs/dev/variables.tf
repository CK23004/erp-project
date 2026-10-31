# ── Dev Environment — Variable Declarations ───────────────────────────────
# Actual values live in terraform.tfvars — this file just declares types
# and descriptions so Terraform can validate input.

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
}

variable "cluster_name" {
  description = "Unique name for the EKS cluster (e.g. eks-dev)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "node_instance_type" {
  description = "EC2 instance type for worker nodes"
  type        = string
}

variable "desired_nodes" {
  description = "Desired worker node count"
  type        = number
}

variable "min_nodes" {
  description = "Minimum worker node count"
  type        = number
}

variable "max_nodes" {
  description = "Maximum worker node count"
  type        = number
}
