# Stage 1: Base
FROM node:20-slim AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Compile Next.js
RUN npm run build

# Stage 4: Runner
FROM base AS runner
# Install postgresql-client for pg_dump and psql database utilities
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built files with node user ownership
COPY --from=builder --chown=node:node /app ./

# Setup backups folder and adjust permissions
RUN mkdir -p /app/backups && chown -R node:node /app/backups

EXPOSE 3000

# Run under standard non-root node user
USER node

CMD ["npx", "next", "start"]
