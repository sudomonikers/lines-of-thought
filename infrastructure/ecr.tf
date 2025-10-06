# ECR Repository for Lambda Container Images
resource "aws_ecr_repository" "lambda_api" {
  name                 = "lines-of-thought-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "lambda_api" {
  repository = aws_ecr_repository.lambda_api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Build and push initial Docker image (only runs once on creation)
resource "null_resource" "docker_build_push" {
  depends_on = [aws_ecr_repository.lambda_api]

  triggers = {
    # Only run when ECR repository is created
    ecr_repository_id = aws_ecr_repository.lambda_api.id
  }

  provisioner "local-exec" {
    working_dir = "${path.module}/../apis"
    command     = <<-EOT
      set -e
      echo "Building TypeScript..."
      npm run build

      echo "Building Docker image..."
      docker build -t ${aws_ecr_repository.lambda_api.name}:latest .

      echo "Logging in to ECR..."
      aws ecr get-login-password --region ${local.region} | \
        docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${local.region}.amazonaws.com

      echo "Tagging image..."
      docker tag ${aws_ecr_repository.lambda_api.name}:latest ${aws_ecr_repository.lambda_api.repository_url}:latest

      echo "Pushing to ECR..."
      docker push ${aws_ecr_repository.lambda_api.repository_url}:latest
    EOT
  }
}

# Output ECR repository URL
output "ecr_repository_url" {
  value = aws_ecr_repository.lambda_api.repository_url
}
