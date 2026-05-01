FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# --- Build frontend ---
FROM deps AS builder
COPY . .
RUN pnpm build

# --- Production ---
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod || pnpm install --prod
# tsx is needed at runtime to execute server.ts
RUN pnpm add tsx

COPY server.ts ./
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/data /app/uploads

ENV PORT=3000
EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
