# Stage 1: Build the TypeScript code
FROM node:20-alpine AS builder
WORKDIR /test/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8787
CMD ["node", "server.js"]
