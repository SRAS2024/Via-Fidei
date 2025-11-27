# syntax=docker/dockerfile:1

# Build stage  client bundle + Prisma client
FROM node:20 AS builder

# Create app directory
WORKDIR /app

# Install dependencies (includes devDependencies for Vite / Prisma)
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build the React client to client/dist
RUN npm run build:client

# Generate Prisma client (uses devDependency "prisma")
RUN npm run prisma:generate

# Runtime stage
FROM node:20 AS runner

WORKDIR /app

# Environment
ENV NODE_ENV=production
ENV PORT=5000

# Install all dependencies (including prisma CLI since you use prestart)
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Copy built client from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Expose app port
EXPOSE 5000

# Start your Node server (prestart will run migrations if defined)
CMD ["npm", "start"]
