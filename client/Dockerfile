# Use Node.js 22 on Alpine Linux
FROM node:22-alpine

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
# We use npm ci for a clean, deterministic install
RUN npm ci

# Copy source code
COPY . .

# Build the application (client + server)
RUN npm run build

# Expose the application port
EXPOSE 3467

# Start the server
CMD ["npm", "start"]
