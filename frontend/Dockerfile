# frontend/Dockerfile
# 1) Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# copy package files and install deps
COPY frontend/package*.json ./ 
RUN npm ci

# copy source and build
COPY frontend/ ./
RUN npm run build

# 2) Production stage: nginx
FROM nginx:stable-alpine
# remove default static files
RUN rm -rf /usr/share/nginx/html/*

# copy built static site
COPY --from=builder /app/dist /usr/share/nginx/html

# Add a small nginx config to handle SPA route fallback (optional)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
