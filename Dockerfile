# Stage 1: Build the React client and Server
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Expose port and run in production mode
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/server.cjs"]
