FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for build)
RUN npm ci

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

CMD ["npm", "run", "start:prod"]
