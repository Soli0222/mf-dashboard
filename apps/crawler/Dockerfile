FROM mcr.microsoft.com/playwright:v1.48.0-noble

WORKDIR /app

# Install pnpm directly (avoid corepack issues in container)
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/crawler/package.json apps/crawler/
COPY packages/db/package.json packages/db/
COPY packages/meta/package.json packages/meta/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/crawler apps/crawler
COPY packages/db packages/db
COPY packages/meta packages/meta
COPY tsconfig.json ./

# Build (if needed)
RUN pnpm --filter @moneyforward-daily-action/db build 2>/dev/null || true

# Default environment
ENV DB_PATH=/data/moneyforward.db

CMD ["pnpm", "--filter", "@moneyforward-daily-action/crawler", "start"]
