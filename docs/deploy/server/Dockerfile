FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
# Sans scripts : better-sqlite3 embarque ses binaires (dont Alpine), pas besoin de Python ni de g++
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=<PORT>
ENV DATABASE_FILE=/app/data/<APP>.db

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist

EXPOSE <PORT>
CMD ["node", "dist/index.js"]
