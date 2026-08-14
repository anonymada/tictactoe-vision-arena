# Use a lightweight Node.js base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package manifests first and install dependencies (cache-friendly)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy remaining sources
COPY . .

# Production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port and start server
EXPOSE 3000
CMD ["node", "server/server.js"]
