# syntax=docker/dockerfile:1

# Stage 1: build client and prepare app
FROM node:20 AS build

WORKDIR /app

# Install root dependencies (server, Prisma, etc)
COPY package.json package-lock.json* ./
RUN npm install

# Install client dependencies
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install

# Copy the rest of the repo and build the client
WORKDIR /app
COPY . .

# Build the React client into client/dist
RUN npm run build

# Stage 2: production image
FROM node:20 AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy only what we actually need to run
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Application source and built client
COPY --from=build /app/client/dist ./client/dist
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
