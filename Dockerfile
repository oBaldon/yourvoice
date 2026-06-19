# ---- build client ----
FROM node:22-bookworm AS client
WORKDIR /app
ENV NODE_ENV=development
ENV NODE_OPTIONS=--dns-result-order=ipv4first
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
ENV NPM_CONFIG_FETCH_TIMEOUT=120000
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --include=dev --no-audit
COPY client ./client
RUN npm run client:build

# ---- build server ----
FROM node:22-bookworm AS server
WORKDIR /app
ENV NODE_ENV=development
ENV NODE_OPTIONS=--dns-result-order=ipv4first
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FETCH_RETRIES=5
ENV NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000
ENV NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000
ENV NPM_CONFIG_FETCH_TIMEOUT=120000
RUN echo 'Acquire::ForceIPv4 "true"; Acquire::Retries "5";' > /etc/apt/apt.conf.d/99force-ipv4 \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --include=dev --no-audit
COPY server ./server
COPY --from=client /app/client/dist ./server/public
RUN npm run server:build
RUN npm prune --omit=dev --no-audit

# ---- runtime ----
FROM node:22-bookworm
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--dns-result-order=ipv4first
COPY --chown=node:node --from=server /app/server/dist ./dist
COPY --chown=node:node --from=server /app/server/public ./public
COPY --chown=node:node --from=server /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
