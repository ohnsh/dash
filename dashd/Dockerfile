# https://bun.com/docs/guides/ecosystem/docker

FROM oven/bun:alpine AS base
WORKDIR /app

COPY package.json ./

RUN bun install # --frozen-lockfile

# see .dockerignore
COPY . .

# stage 2
# minimal production container
FROM base AS runner
WORKDIR /app

# Safely copy only required production artifacts
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/src ./src

# need to look at bun's docker docs. this doesn't work.
USER bun

# ENV NODE_ENV=production
ENV PORT=4100

EXPOSE 4100

ENTRYPOINT ["bun", "run", "dev"]

