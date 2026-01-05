FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with legacy peer deps to handle version conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Expose the Next.js dev server port
EXPOSE 3000

# Start the dev server (skip typegen predev script in Docker)
CMD ["npx", "next", "dev", "--turbopack", "-p", "3000"]
