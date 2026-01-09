FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY server.js ./
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 3000 3001

CMD ["node", "server.js"]
