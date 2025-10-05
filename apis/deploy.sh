#!/bin/bash

set -e

echo "Building API..."
npm run build

echo "Packaging Lambda function..."
# TypeScript already compiled everything to dist/
# Just need to ensure node_modules is there
cp -r node_modules dist/ 2>/dev/null || true
cp package.json dist/ 2>/dev/null || true

cd dist
zip -r ../lambda-deployment.zip . -q
cd ..

echo "Uploading to S3..."
S3_BUCKET="lines-of-thought-general-bucket"
S3_KEY="lambda-deployments/lambda-deployment-$(date +%s).zip"

aws s3 cp lambda-deployment.zip "s3://${S3_BUCKET}/${S3_KEY}" --region us-east-1

echo "Deploying to AWS Lambda from S3..."
aws lambda update-function-code \
  --function-name lines-of-thought-lambda \
  --s3-bucket "${S3_BUCKET}" \
  --s3-key "${S3_KEY}" \
  --region us-east-1

echo "Cleaning up..."
rm -rf dist
rm lambda-deployment.zip

echo "API deployment complete!"
