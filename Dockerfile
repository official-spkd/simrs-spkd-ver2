# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

# --- build: hasil Nuxt (.output) sudah berisi server Nitro + aset, tanpa node_modules
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# --- run
FROM node:${NODE_VERSION}-alpine
RUN apk add --no-cache tzdata
WORKDIR /app

COPY --from=build --chown=node:node /src/.output ./.output

USER node
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    TZ=Asia/Jakarta
EXPOSE 3000

# Alamat backend dibaca saat container berjalan (bukan saat build):
#   NUXT_PUBLIC_API_BASE=http://<host-backend>:8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

CMD ["node", ".output/server/index.mjs"]
