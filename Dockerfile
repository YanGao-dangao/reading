FROM oven/bun:1.3.10

WORKDIR /app

# Copy workspace manifests first for better layer caching.
COPY package.json bun.lock .npmrc ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json

RUN bun install --frozen-lockfile

# Copy source code after dependency installation.
COPY . .

ENV NODE_ENV=production
ENV PORT=3101
ENV WEB_PORT=8080
ENV VITE_API_BASE=/api
ENV VITE_PROXY_TARGET=http://127.0.0.1:3101

RUN bun run --filter @zhidu/web build

EXPOSE 8080

CMD ["sh", "-c", "bun run --filter @zhidu/server start & SERVER_PID=$!; bun run --filter @zhidu/web preview -- --host 0.0.0.0 --port ${WEB_PORT}; EXIT_CODE=$?; kill ${SERVER_PID}; wait ${SERVER_PID} 2>/dev/null; exit ${EXIT_CODE}"]
