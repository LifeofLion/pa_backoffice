FROM node:20.11.0-slim AS builder

RUN apt-get update \
 && apt-get install -y curl bash ca-certificates unzip \
 && rm -rf /var/lib/apt/lists/*

ENV BUN_INSTALL=/usr/local
ENV PATH="$BUN_INSTALL/bin:$PATH"

RUN curl -fsSL https://bun.sh/install -o /tmp/install-bun.sh \
 && bash /tmp/install-bun.sh \
 && rm /tmp/install-bun.sh

WORKDIR /app
COPY . .
RUN bun install
RUN node_modules/.bin/next build

FROM oven/bun:1 AS runner

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next       ./.next
COPY --from=builder /app/public       ./public
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3001
CMD ["bun", "run", "start"]
