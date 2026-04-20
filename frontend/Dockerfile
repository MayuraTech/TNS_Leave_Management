# Multi-stage build for Angular 17 application
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build for production
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy Angular build output (Angular 17 outputs to dist/frontend/browser)
COPY --from=build /app/dist/frontend/browser ./

# Copy nginx template (envsubst replaces ${API_URL} at startup)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default API URL — override via ECS task definition env var
ENV API_URL=http://tns-leave-application-alb-1905426526.us-west-2.elb.amazonaws.com

# Ensure nginx can write temp files
RUN mkdir -p /var/cache/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
