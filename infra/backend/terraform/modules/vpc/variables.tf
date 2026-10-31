# ── VPC Module — Input Variables ─────────────────────────────────────────
# All values are passed in from the environment root (envs/dev, envs/stage, envs/prod).
# Nothing is hardcoded here so the same module works for every environment.

variable "cluster_name" {
  description = "Used as a name prefix for all VPC resources and for the Kubernetes cluster tag"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC (e.g. 10.0.0.0/16 for dev, 10.1.0.0/16 for stage)"
  type        = string
}
