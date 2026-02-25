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
COPY nginx-rate-limit.conf /etc/nginx/conf.d/00-rate-limit.conf
COPY nginx-log-format.conf /etc/nginx/conf.d/01-log-format.conf
RUN sed -i 's/\r$//' /etc/nginx/conf.d/default.conf \
    && sed -i 's/\r$//' /etc/nginx/conf.d/00-rate-limit.conf \
    && sed -i 's/\r$//' /etc/nginx/conf.d/01-log-format.conf

# Copy entrypoint script and fix Windows line endings
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Ensure js/ directory exists for runtime-generated app-config.js
RUN mkdir -p /usr/share/nginx/html/js

# Set ownership for non-root operation
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

# Allow nginx to run without 'user' directive (non-root)
RUN sed -i 's/^user  nginx;/# user  nginx;/' /etc/nginx/nginx.conf

# Accept build args for version info
ARG BUILD_VERSION=unknown
ARG BUILD_TIME=unknown
ENV BUILD_VERSION=${BUILD_VERSION}
ENV BUILD_TIME=${BUILD_TIME}

# Run as non-root user
USER nginx

# Expose port 8080 (non-privileged)
EXPOSE 8080

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1

# Use entrypoint to generate config, then start nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
