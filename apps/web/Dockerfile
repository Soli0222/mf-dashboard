FROM node:22-alpine AS base

# Install pnpm directly (avoid corepack issues)
RUN npm install -g pnpm@10

FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/meta/package.json packages/meta/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/web apps/web
COPY packages/db packages/db
COPY packages/meta packages/meta
COPY tsconfig.json ./

# Build
RUN pnpm --filter @moneyforward-daily-action/web build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
