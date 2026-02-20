# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.base.json ./

# Copy workspace package files
COPY apps/api/package*.json ./apps/api/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/config/package*.json ./packages/config/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types
COPY packages/config ./packages/config

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the application
WORKDIR /app
RUN npm run build --workspace=apps/api

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
