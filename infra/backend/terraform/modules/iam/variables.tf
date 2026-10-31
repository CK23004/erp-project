# ── IAM Module — Input Variables ─────────────────────────────────────────
# cluster_name is used as a prefix so roles are unique per environment,
# e.g. eks-dev-cluster-role, eks-prod-cluster-role.

variable "cluster_name" {
  description = "Prefix for IAM role names — keeps roles unique across dev/stage/prod"
  type        = string
}
