# EventBridge rule: fire once per day to keep Neo4j Aura from auto-pausing
resource "aws_cloudwatch_event_rule" "neo4j_keep_alive" {
  name                = "${local.lambda_name}-neo4j-keep-alive"
  description         = "Daily ping to GET /nodes/all to keep Neo4j Aura active"
  schedule_expression = "cron(0 12 * * ? *)" # 12:00 UTC every day
}

# Target: invoke the API Lambda with a synthesized API Gateway proxy event
resource "aws_cloudwatch_event_target" "neo4j_keep_alive" {
  rule      = aws_cloudwatch_event_rule.neo4j_keep_alive.name
  target_id = "ApiLambdaKeepAlive"
  arn       = aws_lambda_function.api.arn

  input = jsonencode({
    resource                        = "/{proxy+}"
    path                            = "/nodes/all"
    httpMethod                      = "GET"
    headers                         = { Host = "keep-alive.internal" }
    multiValueHeaders               = {}
    queryStringParameters           = { limit = "1", skip = "0" }
    multiValueQueryStringParameters = { limit = ["1"], skip = ["0"] }
    pathParameters                  = { proxy = "nodes/all" }
    stageVariables                  = null
    requestContext = {
      resourcePath = "/{proxy+}"
      httpMethod   = "GET"
      path         = "/prod/nodes/all"
      stage        = "prod"
      identity     = { sourceIp = "127.0.0.1" }
    }
    body            = null
    isBase64Encoded = false
  })
}

# Allow EventBridge to invoke the Lambda
resource "aws_lambda_permission" "allow_eventbridge_keep_alive" {
  statement_id  = "AllowEventBridgeKeepAliveInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.neo4j_keep_alive.arn
}
