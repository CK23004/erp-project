# ── Prod Environment — Variable Values ───────────────────────────────────
# Production is sized for real workload. Uses c7i-flex.large (same as your
# original code) and scales up to 4 nodes.
# The vpc_cidr 10.2.0.0/16 avoids overlap with dev (10.0.x.x) and stage (10.1.x.x).
# Subnets will be 10.2.0.0/24 and 10.2.1.0/24.

aws_region         = "us-east-1"
cluster_name       = "eks-prod"
vpc_cidr           = "10.2.0.0/16"
node_instance_type = "c7i-flex.large"
desired_nodes      = 2
min_nodes          = 2
max_nodes          = 4
