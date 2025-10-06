import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

// Use US cross-region inference profile for on-demand throughput
const MODEL_ID = 'us.anthropic.claude-3-5-haiku-20241022-v1:0';

// Initialize Bedrock client - use us-east-2 for inference profile
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequest {
  messages: ClaudeMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  system?: string;
}

export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Invoke Claude 3.5 Haiku for text generation
 */
export async function invokeClaude(request: ClaudeRequest): Promise<ClaudeResponse> {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: request.max_tokens || 4096,
    messages: request.messages,
    temperature: request.temperature ?? 1.0,
    top_p: request.top_p ?? 0.999,
    ...(request.system && { system: request.system }),
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  return responseBody as ClaudeResponse;
}

/**
 * Invoke Claude 3.5 Haiku with streaming response
 */
export async function* invokeClaudeStream(request: ClaudeRequest): AsyncGenerator<string> {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: request.max_tokens || 4096,
    messages: request.messages,
    temperature: request.temperature ?? 1.0,
    top_p: request.top_p ?? 0.999,
    ...(request.system && { system: request.system }),
  };

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);

  if (response.body) {
    for await (const event of response.body) {
      if (event.chunk) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          yield chunk.delta.text;
        }
      }
    }
  }
}
