import { invokeClaude } from './bedrock';

/**
 * Use Claude 3.5 Haiku to moderate content for philosophical thought quality
 */
export async function moderateContent(text: string): Promise<{ isValid: boolean; reason?: string }> {
  try {
    const response = await invokeClaude({
      messages: [
        {
          role: 'user',
          content: `You are a content moderator for a philosophical thought exploration platform. Analyze the following text and determine if it is a legitimate philosophical thought, idea, question, or reflection worthy of exploration.

                    Reject if the text is:
                    - Spam or bot-generated garbage
                    - Random characters or nonsense
                    - Promotional/advertising content
                    - Offensive or hateful content
                    - Empty or meaningless content
                    - Specific to a person or entity for example a political figure

                    Accept if the text is:
                    - A genuine philosophical question or thought
                    - A reflection or idea worth exploring
                    - A concept or theory, even if simple
                    - A personal insight or observation

                    Text to analyze: "${text}"

                    Respond with ONLY a JSON object in this exact format:
                    {"valid": true/false, "reason": "brief explanation"}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const content = response.content[0]?.text;
    if (!content) {
      // If moderation fails, allow the content (fail open)
      return { isValid: true };
    }

    // Parse the JSON response
    const result = JSON.parse(content);

    return {
      isValid: result.valid === true,
      reason: result.reason,
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    // Fail open - if moderation fails, allow the content
    return { isValid: true };
  }
}
