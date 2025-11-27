# Dockerfile
# Via Fidei multi stage build: build client, generate Prisma client, then run Node server.

# Stage 1: build client and generate Prisma client
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Build the React client (outputs to client/dist)
RUN npm run build:client

# Generate Prisma client so the server can use Prisma in the runtime image
RUN npm run prisma:generate

# Stage 2: runtime image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy only what we need into the runtime image
COPY package*.json ./

# Bring over node_modules from the builder
COPY --from=builder /app/node_modules ./node_modules

# Server and backend code
COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app/server ./server
COPY --from=builder /app/database ./database
COPY --from=builder /app/prisma.schema ./prisma.schema

# Built React client
COPY --from=builder /app/client/dist ./client/dist

# Expose the port Railway will connect to
EXPOSE 5000

# Use npm start so your prestart script can run migrations:
#   "prestart": "npm run prisma:migrate"
CMD ["npm", "start"]
