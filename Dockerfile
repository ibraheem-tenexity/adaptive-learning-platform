FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time placeholder env so next build doesn't fail on module imports
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_SECRET="build-time-placeholder-secret-32chars"
ENV OPENROUTER_API_KEY="mock"

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/lib/db/migrate.ts ./lib/db/migrate.ts
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
