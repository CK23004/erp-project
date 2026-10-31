#!/bin/bash
# ── Bootstrap ECR Repositories ────────────────────────────────────────────
# Run this ONCE before the first backend pipeline run.
# Creates three ECR repos (one per service) in your AWS account.
#
# Usage: ./scripts/bootstrap-ecr.sh [region]
# Default region: us-east-1

set -e
REGION=${1:-us-east-1}

REPOS=("smartbiz-user-service" "smartbiz-inventory-service" "smartbiz-sales-service")

echo "Creating ECR repositories in region: $REGION"

for repo in "${REPOS[@]}"; do
    echo "Creating: $repo"
    aws ecr create-repository \
        --repository-name "$repo" \
        --region "$REGION" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 \
        2>/dev/null && echo "  ✅ Created $repo" || echo "  ⚠️  $repo already exists, skipping"
done

echo ""
echo "Done. ECR repositories:"
aws ecr describe-repositories \
    --repository-names "${REPOS[@]}" \
    --region "$REGION" \
    --query 'repositories[*].repositoryUri' \
    --output table
