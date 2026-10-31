# ── Dev Environment — Variable Values ────────────────────────────────────
# Dev is sized small to keep costs low. t3.medium is fine for testing.
# The vpc_cidr 10.0.0.0/16 gives subnets 10.0.0.0/24 and 10.0.1.0/24.

aws_region         = "us-east-1"
cluster_name       = "eks-dev"
vpc_cidr           = "10.0.0.0/16"
node_instance_type = "t3.medium"
desired_nodes      = 1
min_nodes          = 1
max_nodes          = 2
