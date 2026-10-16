# syntax=docker/dockerfile:1

########## Stage 1: build the client ##########
FROM node:24-alpine AS client-build

WORKDIR /app

# Install client dependencies first for better layer caching
COPY client/package.json client/package-lock.json client/
RUN npm --prefix client ci

# Build the client; `sync-dist.mjs` copies the bundle into /app/server/dist
COPY client/ client/
RUN npm --prefix client run build

########## Stage 2: production image ##########
FROM node:24-alpine AS runtime

ENV NODE_ENV=production \
    SERVER_PORT=8421

WORKDIR /app/server

# Production dependencies only
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Server source (TypeScript is run directly by Node 24) + built client
COPY server/ ./
COPY --from=client-build /app/server/dist ./dist

# The file manager and articles read/write ./media — keep it writable
RUN mkdir -p media && chown node:node media

USER node
EXPOSE 8421

CMD ["node", "main.ts"]
