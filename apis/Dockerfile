FROM public.ecr.aws/lambda/nodejs:22

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including @xenova/transformers)
RUN npm ci --production

# Copy application code directly to Lambda task root
COPY dist/ ./

# Set the handler
CMD [ "index.handler" ]
