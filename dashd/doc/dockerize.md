The best way to deploy a Bun application in Docker is by using a multi-stage build based on the official oven/bun image. This approach ensures your production image is secure, lightweight, and includes only necessary runtime components. [1, 2, 3]

1. Optimal Multi-Stage Dockerfile
Create a  in your root directory. This configuration isolates the dependency installation/build process from the actual production execution environment: [1, 2, 4, 5]

```Dockerfile
# Stage 1: Build dependencies and source code
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy configuration files first to utilize Docker layer caching
COPY package.json bun.lockb ./

# Install all dependencies (including devDependencies) safely
RUN bun install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Run build step if your framework requires compilation (e.g., Next.js, Nuxt)
# RUN bun run build

# Stage 2: Production execution environment
FROM oven/bun:1-distroless AS runner
WORKDIR /app

# Safely copy only required production artifacts
COPY --from=builder /app/package.json /app/bun.lockb ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
# COPY --from=builder /app/dist ./dist # Uncomment if using a compiled/bundled project

# Enforce security by running as a non-root user
USER bun

# Set environment to production
ENV NODE_ENV=production

# Expose your application's port
EXPOSE 3000

# Execute the application directly
ENTRYPOINT ["bun", "run", "src/index.ts"]
```

```ignore
# .dockerignore

node_modules
.git
.env
dist
.build
```

```bash
docker build --pull -t my-bun-app .
```

• Use `--frozen-lockfile`: This forces  to respect your exactly locked  state. It blocks accidental package updates that break builds mid-pipeline.
• Leverage Distroless Images: The  tag removes standard OS shells and packages. This dramatically reduces your attack surface compared to full Linux distros. If you require standard system tools, use  instead.
• Enforce Non-Root Execution: Adding `USER bun` shifts the internal environment to a safe, low-privileged user account managed natively by the base image.
• Handle Entrypoint Correctly: Prefer `ENTRYPOINT ["bun", "run", ...]` over standard `CMD`. This guarantees that Unix termination processes (SIGTERM) pass down perfectly to Bun for graceful application shutdowns. [1, 2, 4]

---

If the container needs to be accessible to another container, is it okay to simply use the published port on the host (host.docker.internal) or should I try to get them on the same bridge network?

```compose.yml
services:
  backend:
    build: .
    # No "ports" mapping needed unless you want to access it from your actual desktop
    expose:
      - "3000"

  frontend:
    image: nginx:alpine
    environment:
      - API_URL=http://backend:3000 # Connects seamlessly using the service name
```

To reference a network between separate compose.yml files, you must prevent Docker from adding its default folder-name prefix to the network name. You do this by configuring an explicit, global name string in the first file, and flagging it as external: true in the second file. [1, 2, 3, 4]

## File 1: The Creator (backend/compose.yml)
This file spins up your backend and establishes the shared network. By setting the name attribute inside the networks block, you force Docker Compose to bypass its usual backend_ project prefix. [2, 5, 6]

```yaml
services:
  bun-app:
    build: .
    networks:
      - shared_link
networks:
  shared_link:
    name: corporate-global-network  # Gives the network a clean, explicit global name
    driver: bridge
```

## File 2: The Consumer (frontend/compose.yml)
This file is completely separate, located in a different directory. Setting external: true instructs Compose to search your local Docker engine for an existing network with that precise name instead of trying to create a new one. [1, 3, 4, 7]

```yaml
services:
  nginx-proxy:
    image: nginx:alpine
    networks:
      - shared_link
networks:
  shared_link:
    external: true
    name: corporate-global-network  # Points directly to File 1's created network
```

## ⚠️ The Execution Rule: Startup Order Matters
Because File 2 references an external asset, running docker compose up on the frontend will crash with a "network not found" error if the backend is not running yet. [8, 9, 10]

## Alternative: Independent Network Creation
If you want to avoid a strict dependency chain where one project must start before the other, you can bypass Compose creation altogether and declare it manually using the CLI: [3, 11]

`docker network create company-mesh-net`

Once created via the terminal, you can mark the network as external: true with name: company-mesh-net in both compose.yml files. This allows you to spin your frontend or backend up and down independently in any order you choose. [6, 11]

[1] [https://stackoverflow.com](https://stackoverflow.com/questions/38088279/communication-between-multiple-docker-compose-projects)
[2] [https://opensourceisfun.substack.com](https://opensourceisfun.substack.com/p/docker-networks-part-3-docker-compose)
[3] [https://docs.docker.com](https://docs.docker.com/compose/how-tos/networking/)
[4] [https://docs.docker.com](https://docs.docker.com/reference/compose-file/networks/)
[5] [https://github.com](https://github.com/docker/compose/issues/4179)
[6] [https://lours.me](https://lours.me/posts/compose-tip-013-external-networks/)
[7] [https://medium.com](https://medium.com/@triwicaksono.com/networks-in-docker-compose-0943abe3de54)
[8] [https://www.reddit.com](https://www.reddit.com/r/docker/comments/1gujmkt/how_do_i_use_dockercompose_to_connect_a/)
[9] [https://github.com](https://github.com/docker/compose/issues/4179)
[10] [https://github.com](https://github.com/docker/compose/issues/4179)
[11] [https://oneuptime.com](https://oneuptime.com/blog/post/2026-01-25-communication-between-docker-compose-projects/view)


[1] https://oneuptime.com/blog/post/2026-01-31-bun-production-deployment/view
[2] https://flori.dev/reads/running-bun-with-docker
[3] https://lobehub.com/skills/secondsky-claude-skills-bun-docker
[4] https://docs.railway.com/guides/bun
[5] https://medium.com/@pdemeulenaer/deploying-a-lightweight-embedding-model-for-rag-using-docker-and-fastapi-d29c0643ffdd
[6] https://www.youtube.com/watch?v=7fPihOaVQF8
[7] https://sliplane.io/blog/how-to-dockerize-a-bun-app
[8] https://betterstack.com/community/guides/scaling-nodejs/dockerize-nodejs/
[9] https://learn.microsoft.com/en-us/azure/container-apps/javascript-overview
[10] https://www.rapidevelopers.com/lovable-integration/docker
[11] https://bun.com/docs/guides/ecosystem/docker
[12] https://docs.docker.com/guides/bun/
[13] https://oven-sh-bun.mintlify.app/guides/docker
[14] https://medium.com/@sparklewebhelp/mastering-docker-5-best-practices-for-seamless-app-deployment-9aff6d8b1746
[15] https://harrisoncramer.me/optimizing-your-docker-images-for-production
[16] https://bun.com/docs/guides/deployment/google-cloud-run
[17] https://bun.com/docs/guides/deployment/digital-ocean
[18] https://www.reddit.com/r/bun/comments/1pvzxmv/where_do_you_deploy_your_bun_app_to/
[19] https://medium.com/@stanleymohr/using-bun-hono-and-docker-to-deploy-lightweight-apis-7040cf8a5ac4
[20] https://oneuptime.com/blog/post/2026-02-08-how-to-containerize-an-elysia-bun-application-with-docker/view
