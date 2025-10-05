# IAM Role for API Gateway to write CloudWatch Logs (account-level setting)
# This role is required for API Gateway to push access logs to CloudWatch
# Note: This is an account-wide setting, not specific to a single API

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "api-gateway-cloudwatch-global"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

# Attach the AWS managed policy for API Gateway to push to CloudWatch Logs
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Set the CloudWatch Logs role in API Gateway account settings
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}
