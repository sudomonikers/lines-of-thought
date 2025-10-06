// @ts-ignore - @xenova/transformers doesn't have type definitions
import { pipeline, env } from '@xenova/transformers';

// Configure transformers to download models at runtime
env.allowLocalModels = false;
env.useBrowserCache = false;
env.cacheDir = '/tmp/transformers_cache'; // Use Lambda's /tmp directory for caching

// Cache the model pipeline to avoid reloading it on every request
let embeddingPipeline: any = null;

/**
 * Initialize the embedding pipeline with the all-MiniLM-L6-v2 model
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    // Use embeddings pipeline instead of feature-extraction
    embeddingPipeline = await pipeline('embeddings', 'sentence-transformers/all-MiniLM-L6-v2');
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
    const extractor = await getEmbeddingPipeline();

    // Generate embeddings - embeddings pipeline might not need pooling/normalize options
    const output = await extractor(text);

    // Convert tensor to array
    const embedding = Array.from(output['data'] || output) as number[];

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
