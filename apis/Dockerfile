FROM public.ecr.aws/lambda/nodejs:22

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including @xenova/transformers)
RUN npm ci --production

# Pre-download the embedding model during build
# This runs a Node script to cache the model in the container
RUN node -e " \
  const { pipeline, env } = require('@xenova/transformers'); \
  env.cacheDir = '/opt/models'; \
  env.allowLocalModels = true; \
  (async () => { \
    console.log('Downloading model...'); \
    await pipeline('embeddings', 'sentence-transformers/all-MiniLM-L6-v2'); \
    console.log('Model downloaded to /opt/models'); \
  })(); \
"

# Copy application code directly to Lambda task root
COPY dist/ ./

# Set the handler
CMD [ "index.handler" ]
