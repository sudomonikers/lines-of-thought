#!/bin/bash

set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO_NAME="lines-of-thought-api"
LAMBDA_FUNCTION_NAME="lines-of-thought-lambda"
IMAGE_TAG="latest"

echo "Building TypeScript..."
npm run build

echo "Building Docker image for x86_64/amd64..."
docker build --platform linux/amd64 -t ${ECR_REPO_NAME}:${IMAGE_TAG} .

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Tag image for ECR
ECR_IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}"
docker tag ${ECR_REPO_NAME}:${IMAGE_TAG} ${ECR_IMAGE_URI}

# Push to ECR
echo "Pushing image to ECR..."
docker push ${ECR_IMAGE_URI}

# Update Lambda function to use container image
echo "Updating Lambda function..."
aws lambda update-function-code \
  --function-name ${LAMBDA_FUNCTION_NAME} \
  --image-uri ${ECR_IMAGE_URI} \
  --region ${AWS_REGION}

echo ""
echo "Deployment complete!"
echo "Image URI: ${ECR_IMAGE_URI}"
