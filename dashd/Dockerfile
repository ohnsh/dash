FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json ./

RUN bun install # --frozen-lockfile

# see .dockerignore
COPY . .

# stage 2
# minimal distro-less production container
FROM oven/bun:1-distroless AS runner
WORKDIR /app

# Safely copy only required production artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# need to look at bun's docker docs. this doesn't work.
USER bun

ENV NODE_ENV=production
ENV PORT=4100

EXPOSE 4100

ENTRYPOINT ["bun", "run", "src/index.ts"]

