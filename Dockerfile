# Stage 1  build everything (server deps, client build, Prisma client)
FROM node:20 AS builder

# Work inside /app
WORKDIR /app

# Install dependencies first to cache them
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the React client into /client/dist
RUN npm run build:client

# Generate Prisma client
RUN npm run prisma:generate

# Stage 2  lightweight runtime image
FROM node:20 AS runner

WORKDIR /app

# Copy only what we need from the builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma.schema ./prisma.schema
COPY --from=builder /app/database ./database
COPY --from=builder /app/client/dist ./client/dist

# Environment
ENV NODE_ENV=production

# Railway will inject PORT  do not hard code it here
EXPOSE 5000

# Start the server  prestart in package.json will run prisma:migrate
CMD ["npm", "run", "start"]
