# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (sharp, bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY backend/package*.json ./
COPY shared/package*.json ../shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/ ./
COPY shared/ ../shared/

# Generate Prisma client
RUN npx prisma generate

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for sharp
RUN apk add --no-cache vips-dev

# Copy package files
COPY backend/package*.json ./
COPY shared/package*.json ../shared/

# Copy built node_modules from builder (includes all compiled native modules)
COPY --from=builder /app/node_modules ./node_modules

# Copy source code and generated Prisma client
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder ../shared ../shared

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Create non-root user (node user exists in alpine)
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npx", "tsx", "src/app.ts"]
