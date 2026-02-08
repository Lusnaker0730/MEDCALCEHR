# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (leverages Docker cache)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production image
FROM nginx:alpine AS production

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built assets from builder stage
COPY --from=builder /app/dist .

# Copy nginx configuration and fix Windows line endings
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i 's/\r$//' /etc/nginx/conf.d/default.conf

# Copy entrypoint script and fix Windows line endings
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Accept build args for version info
ARG BUILD_VERSION=unknown
ARG BUILD_TIME=unknown
ENV BUILD_VERSION=${BUILD_VERSION}
ENV BUILD_TIME=${BUILD_TIME}

# Expose port 80
EXPOSE 80

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Use entrypoint to generate config, then start nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
