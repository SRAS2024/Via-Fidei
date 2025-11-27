# syntax=docker/dockerfile:1

FROM node:20 AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build the React client in /client using Vite
RUN npm run build:client

# Generate Prisma client
RUN npm run prisma:generate

# Runtime image
FROM node:20 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy everything, including node_modules and client/dist
COPY --from=build /app /app

EXPOSE 5000

CMD ["node", "index.js"]
