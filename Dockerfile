# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Only copy package files first to leverage cache
COPY package.json package-lock.json* ./
RUN npm ci

# Copy rest of source
COPY . .

# Optional: build step if you use transpilers
# RUN npm run build

# Production runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only necessary files and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/init.sql ./init.sql
COPY --from=builder /app/.env.example ./.env

# Use non-root user where possible
USER node
EXPOSE 3000
CMD ["node", "index.js"]