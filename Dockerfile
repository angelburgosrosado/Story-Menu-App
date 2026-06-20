# Use the official lightweight Node.js 20 image.
# https://hub.docker.com/_/node
FROM node:20-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy local code to the container image.
COPY . ./

# Build the Vite frontend and esbuild backend
RUN npm run build

# Run the web service on container startup.
# Cloud Run automatically injects the PORT environment variable.
CMD [ "npm", "start" ]
