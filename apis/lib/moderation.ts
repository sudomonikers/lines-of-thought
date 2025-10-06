import { invokeClaude } from './bedrock';

/**
 * Analyze the logical strength of an argument between a parent and child thought.
 * Returns a score from -100 to 100 based on logical soundness and coherence.
 *
 * Scoring guide:
 * - 75-100: Exceptionally strong logical connection, rigorous reasoning
 * - 50-74: Strong argument with solid logical foundation
 * - 25-49: Reasonable connection with some logical support
 * - 0-24: Weak connection, tenuous logic
 * - -24-(-1): Poor logic with fallacies present
 * - -49-(-25): Seriously flawed reasoning, multiple fallacies
 * - -100-(-50): Completely fallacious or contradictory
 */
export async function analyzeArgumentStrength(
  parentText: string,
  childText: string
): Promise<{ score: number; analysis?: string }> {
  try {
    const response = await invokeClaude({
      messages: [
        {
          role: 'user',
          content: `You are a logic and reasoning expert analyzing chains of philosophical thought.

                    Parent Thought: "${parentText}"

                    Child Thought (branching from parent): "${childText}"

                    Analyze how logically the child thought follows from or relates to the parent thought. Consider:
                    - Logical validity and soundness
                    - Presence of logical fallacies (ad hominem, strawman, false dichotomy, slippery slope, appeal to emotion, etc.)
                    - Coherence and relevance to the parent idea
                    - Quality of reasoning and inference
                    - Strength of supporting evidence or rationale

                    Assign a score from -100 to 100 where:
                    - 75-100: Exceptionally strong logical connection
                    - 50-74: Strong, well-reasoned argument
                    - 25-49: Reasonable connection with adequate logic
                    - 0-24: Weak or tenuous logical connection
                    - -24-(-1): Poor logic with some fallacies
                    - -49-(-25): Seriously flawed reasoning
                    - -100-(-50): Completely fallacious or contradictory

                    Respond with ONLY a JSON object in this exact format:
                    {"score": <number>, "analysis": "brief explanation of the score and any fallacies identified"}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const content = response.content[0]?.text;
    if (!content) {
      // If analysis fails, return neutral score
      return { score: 0, analysis: 'Analysis failed - assigned neutral score' };
    }

    // Parse the JSON response
    const result = JSON.parse(content);

    // Validate score is within range
    const score = Math.max(-100, Math.min(100, result.score || 0));

    return {
      score,
      analysis: result.analysis,
    };
  } catch (error) {
    console.error('Argument strength analysis error:', error);
    // If analysis fails, return neutral score
    return { score: 0, analysis: 'Analysis failed - assigned neutral score' };
  }
}

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
