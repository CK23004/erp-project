# ── Stage 1: Build ────────────────────────────────────────────────────────
# Use Node to install dependencies and run the Vite build.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first so npm install is cached unless deps change
COPY package.json package-lock.json* ./
# Use npm install so the build works with or without a lock file.
# In CI/CD where you commit package-lock.json, swap this for: npm ci --silent
RUN npm install --silent

# Copy source and build the static assets
COPY . .

# Build args allow the CI/CD pipeline or docker-compose to inject backend URLs
# at build time so they are baked into the Vite bundle.
ARG VITE_USER_API=http://localhost:8081
ARG VITE_INVENTORY_API=http://localhost:8082
ARG VITE_SALES_API=http://localhost:8083

ENV VITE_USER_API=$VITE_USER_API
ENV VITE_INVENTORY_API=$VITE_INVENTORY_API
ENV VITE_SALES_API=$VITE_SALES_API

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────
# Use Nginx to serve the static build output.
# The alpine variant is ~25MB vs ~150MB for the full image.
FROM nginx:1.25-alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the Vite build output from stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config to handle React Router (client-side routing).
# Without this, refreshing on /dashboard returns a 404 from Nginx.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
