# ============================================
# STSMS Backend — Node.js & Express Container
# ============================================
FROM node:20-alpine AS base

WORKDIR /app

# Install system utilities
RUN apk add --no-cache curl

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start server
CMD ["node", "src/server.js"]
