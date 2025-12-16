# ---- build client ----
FROM node:20-bookworm AS client
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY client/package.json ./client/
RUN npm ci
COPY client ./client
RUN npm run client:build

# ---- build server ----
FROM node:20-bookworm AS server
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci
COPY server ./server
# copy client build into server public
COPY --from=client /app/client/dist ./server/public
RUN npm run server:build

# ---- runtime ----
FROM node:20-bookworm
WORKDIR /app
ENV NODE_ENV=production
COPY --from=server /app/server/dist ./dist
COPY --from=server /app/server/public ./public
COPY --from=server /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
