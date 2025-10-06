# Bedrock Model Access
# Enable access to Claude 3.5 Haiku model
resource "aws_bedrockagent_agent" "claude_haiku" {
  agent_name              = "lines-of-thought-haiku"
  agent_resource_role_arn = aws_iam_role.bedrock_role.arn
  foundation_model        = "anthropic.claude-3-5-haiku-20241022-v1:0"
  instruction             = "AI assistant for Lines of Thought application"
}

# IAM Role for Bedrock
resource "aws_iam_role" "bedrock_role" {
  name = "lines-of-thought-bedrock-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Bedrock model invocation
resource "aws_iam_role_policy" "bedrock_invoke_policy" {
  name = "bedrock-invoke-policy"
  role = aws_iam_role.bedrock_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0"
      }
    ]
  })
}

# Lambda IAM policy attachment for Bedrock access
resource "aws_iam_role_policy" "lambda_bedrock_policy" {
  name = "lambda-bedrock-invoke"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0"
      }
    ]
  })
}

# Outputs
output "bedrock_model_id" {
  description = "Claude 3.5 Haiku model ID for inference"
  value       = "anthropic.claude-3-5-haiku-20241022-v1:0"
}

output "bedrock_role_arn" {
  description = "ARN of the Bedrock IAM role"
  value       = aws_iam_role.bedrock_role.arn
}
