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
ENV SERVER_PORT=3101
ENV WEB_PORT=8080
ENV VITE_API_BASE=/api

RUN bun run --filter @zhidu/web build

EXPOSE 8080

CMD ["sh", "-c", "SERVER_PORT=${SERVER_PORT:-3101}; WEB_PORT=${WEB_PORT:-8080}; VITE_PROXY_TARGET=${VITE_PROXY_TARGET:-http://127.0.0.1:${SERVER_PORT}}; PORT=${SERVER_PORT} bun run --filter @zhidu/server start & SERVER_PID=$!; VITE_PROXY_TARGET=${VITE_PROXY_TARGET} bun run --filter @zhidu/web preview -- --host 0.0.0.0 --port ${WEB_PORT}; EXIT_CODE=$?; kill ${SERVER_PID}; wait ${SERVER_PID} 2>/dev/null; exit ${EXIT_CODE}"]
