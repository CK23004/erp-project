# ── VPC Module ────────────────────────────────────────────────────────────
# Creates all networking resources needed by EKS:
#   VPC → 2 public subnets → Internet Gateway → Route Table
# The Kubernetes cluster tag on VPC and subnets is required so that EKS
# can discover and use the networking resources automatically.

# ── Data source: resolve AZ names at plan time ────────────────────────────
# Avoids hardcoding AZ letters (a/b/c) so the module works in any region.
data "aws_availability_zones" "available" {
  state = "available"
}

# ── VPC ───────────────────────────────────────────────────────────────────
# DNS support + hostnames are both required for EKS to function correctly.
resource "aws_vpc" "eks" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name                                        = "${var.cluster_name}-vpc"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# ── Two Public Subnets across two AZs ────────────────────────────────────
# count = 2 spreads nodes across 2 AZs for availability.
# The CIDR is derived from the second octet of the vpc_cidr so each env
# lands in a different /24 (e.g. 10.0.0.0/24 and 10.0.1.0/24 for dev).
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.eks.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                        = "${var.cluster_name}-subnet-${count.index + 1}"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
    # Required tag so the AWS load balancer controller can pick public subnets
    "kubernetes.io/role/elb" = "1"
  }
}

# ── Internet Gateway ──────────────────────────────────────────────────────
# Needed so worker nodes and the EKS API endpoint are reachable from the internet.
resource "aws_internet_gateway" "eks" {
  vpc_id = aws_vpc.eks.id

  tags = {
    Name = "${var.cluster_name}-igw"
  }
}

# ── Route Table: public subnets → IGW ────────────────────────────────────
# Single route table shared by both public subnets.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.eks.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eks.id
  }

  tags = {
    Name = "${var.cluster_name}-rt"
  }
}

# ── Associate each subnet with the route table ────────────────────────────
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
