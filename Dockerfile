# Build and run in one image so dist is always present when the server starts.
FROM node:20-alpine AS base
WORKDIR /app

# Install deps (including devDependencies for Vite build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Runtime: dist is at /app/dist, server at /app/server
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server/index.js"]
