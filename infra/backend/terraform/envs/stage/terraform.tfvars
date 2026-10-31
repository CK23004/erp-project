# ── Stage Environment — Variable Values ──────────────────────────────────
# Stage mirrors prod sizing but with slightly fewer nodes.
# The vpc_cidr 10.1.0.0/16 avoids overlap with dev (10.0.x.x).
# Subnets will be 10.1.0.0/24 and 10.1.1.0/24.

aws_region         = "us-east-1"
cluster_name       = "eks-stage"
vpc_cidr           = "10.1.0.0/16"
node_instance_type = "c7i-flex.large"
desired_nodes      = 2
min_nodes          = 1
max_nodes          = 3
