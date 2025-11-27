# syntax=docker/dockerfile:1

# Stage 1: build client
FROM node:20 AS build

WORKDIR /app

# Install root dependencies (server + client + Vite)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the React client into client/dist
RUN npm run build:client

# Stage 2: production runtime
FROM node:20 AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy app source and built client assets
COPY . .
COPY --from=build /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "index.js"]
