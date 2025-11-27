Dockerfile# Dockerfile
# Via Fidei container for Railway

# 1. Base image
FROM node:20

# 2. Working directory
WORKDIR /app

# 3. Copy package manifests and install dependencies
COPY package*.json ./

# Install all deps including devDependencies so Vite and Prisma work
RUN npm install

# 4. Copy the rest of the app code
COPY . .

# 5. Build the React client (outputs to client/dist via vite.config.js)
RUN npm run build:client

# 6. Expose the port used by index.js
EXPOSE 5000

# 7. Start the server
# prestart will run prisma migrate, postinstall already ran prisma generate
CMD ["npm", "run", "start"]
