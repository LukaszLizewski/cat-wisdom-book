# syntax=docker/dockerfile:1

# ---- Stage 1: build the React frontend ----
FROM node:20-slim AS frontend-build
WORKDIR /frontend
# Trust an optional corporate/proxy CA certificate (e.g. for networks with a
# TLS-inspecting proxy). Place any *.crt files in docker/certs/ before
# building; harmless no-op if the directory is empty.
COPY docker/certs/ /usr/local/share/ca-certificates/corporate/
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends ca-certificates >/dev/null \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: install backend dependencies (includes native modules) ----
FROM node:20-slim AS backend-build
WORKDIR /backend
# Trust the same optional corporate/proxy CA certificate for npm.
COPY docker/certs/ /usr/local/share/ca-certificates/corporate/
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends ca-certificates python3 make g++ >/dev/null \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev
COPY backend/src ./src

# ---- Stage 3: slim runtime image ----
FROM node:20-slim AS runtime
WORKDIR /app
RUN useradd --system --create-home --shell /usr/sbin/nologin appuser \
    && mkdir -p /app/data /app/models \
    && chown -R appuser:appuser /app
COPY --from=backend-build /backend/node_modules ./node_modules
COPY --from=backend-build /backend/package.json ./package.json
COPY --from=backend-build /backend/src ./src
# Bundle the built frontend as static assets served by Express.
COPY --from=frontend-build /frontend/dist ./public
ENV APP_DATA_DIR=/app/data \
    APP_MODELS_DIR=/app/models \
    APP_STATIC_DIR=/app/public \
    NODE_ENV=production
VOLUME ["/app/data", "/app/models"]
EXPOSE 8080
USER appuser
ENTRYPOINT ["node", "src/server.js"]
