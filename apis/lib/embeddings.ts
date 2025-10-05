// @ts-ignore - @xenova/transformers doesn't have type definitions
import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use local cache
env.allowLocalModels = false;
env.useBrowserCache = false;

// Cache the model pipeline to avoid reloading it on every request
let embeddingPipeline: any = null;

/**
 * Initialize the embedding pipeline with the all-MiniLM-L6-v2 model
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('Initializing embedding pipeline...');
    // Use embeddings pipeline instead of feature-extraction
    embeddingPipeline = await pipeline('embeddings', 'sentence-transformers/all-MiniLM-L6-v2');
    console.log('Embedding pipeline initialized');
  }
  return embeddingPipeline;
}

/**
 * Generate embeddings for a given text using all-MiniLM-L6-v2 model
 * @param text - The text to generate embeddings for
 * @returns Array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    console.log('Generating embedding for text:', text.substring(0, 50));
    const extractor = await getEmbeddingPipeline();

    // Generate embeddings - embeddings pipeline might not need pooling/normalize options
    const output = await extractor(text);

    // Convert tensor to array
    console.log('Output type:', typeof output, 'Keys:', Object.keys(output));
    const embedding = Array.from(output['data'] || output) as number[];
    console.log('Embedding generated, length:', embedding.length);

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    throw error;
  }
}
