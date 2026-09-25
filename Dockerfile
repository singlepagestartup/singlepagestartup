FROM node:24.21.0-bookworm

# Keep in step with the bun package version in package-lock.json.
ARG BUN_VERSION=1.2.5

RUN apt-get update && \
    apt-get -qy full-upgrade && \
    apt-get install -qy curl ffmpeg python3 python3-venv && \
    curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash -s "bun-v$BUN_VERSION" && \
    test "$(bun --version)" = "$BUN_VERSION" && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=16384

WORKDIR /usr/src/app/

# The services run as the base image's node user (uid 1000, gid 1000), which
# owns the application tree. The deployer gives the same uid the server mounts.
RUN chown node:node /usr/src/app

USER node

ARG NEXT_PUBLIC_API_SERVICE_URL
ENV NEXT_PUBLIC_API_SERVICE_URL=$NEXT_PUBLIC_API_SERVICE_URL

ARG NEXT_PUBLIC_API_SERVICE_WS_URL
ENV NEXT_PUBLIC_API_SERVICE_WS_URL=$NEXT_PUBLIC_API_SERVICE_WS_URL

ARG NEXT_PUBLIC_HOST_SERVICE_URL
ENV NEXT_PUBLIC_HOST_SERVICE_URL=$NEXT_PUBLIC_HOST_SERVICE_URL

ARG YANDEX_METRIKA_ID
ENV YANDEX_METRIKA_ID=$YANDEX_METRIKA_ID
ENV NEXT_PUBLIC_YANDEX_METRIKA_ID=$YANDEX_METRIKA_ID

# Copying source files
COPY --chown=node:node . .

# write the env variables to a file
RUN if [ -n "$NEXT_PUBLIC_API_SERVICE_URL" ]; then echo "NEXT_PUBLIC_API_SERVICE_URL=$NEXT_PUBLIC_API_SERVICE_URL" >> /usr/src/app/apps/host/.env.production; fi
RUN if [ -n "$NEXT_PUBLIC_API_SERVICE_WS_URL" ]; then echo "NEXT_PUBLIC_API_SERVICE_WS_URL=$NEXT_PUBLIC_API_SERVICE_WS_URL" >> /usr/src/app/apps/host/.env.production; fi
RUN if [ -n "$NEXT_PUBLIC_HOST_SERVICE_URL" ]; then echo "NEXT_PUBLIC_HOST_SERVICE_URL=$NEXT_PUBLIC_HOST_SERVICE_URL" >> /usr/src/app/apps/host/.env.production; fi
RUN if [ -n "$YANDEX_METRIKA_ID" ]; then echo "YANDEX_METRIKA_ID=$YANDEX_METRIKA_ID" >> /usr/src/app/apps/host/.env.production; fi
RUN if [ -n "$NEXT_PUBLIC_YANDEX_METRIKA_ID" ]; then echo "NEXT_PUBLIC_YANDEX_METRIKA_ID=$NEXT_PUBLIC_YANDEX_METRIKA_ID" >> /usr/src/app/apps/host/.env.production; fi

RUN npm ci && npm cache clean --force
RUN python3 -m venv /usr/src/app/apps/llm/.venv && \
    /usr/src/app/apps/llm/.venv/bin/pip install --no-cache-dir -r /usr/src/app/apps/llm/requirements.txt

ARG NEXT_DEPLOYMENT_ID
ENV NEXT_DEPLOYMENT_ID=$NEXT_DEPLOYMENT_ID

RUN npm run host:build && \
    rm -rf /usr/src/app/.nx /usr/src/app/apps/host/.next/cache && \
    rm -rf /usr/src/app/apps/host/.next-static-release && \
    cp -a /usr/src/app/apps/host/.next/static /usr/src/app/apps/host/.next-static-release

EXPOSE 3000
EXPOSE 4000
EXPOSE 3001
EXPOSE 8000
EXPOSE 8765

# Running the app
RUN ["chmod", "+x", "/usr/src/app/migrate.sh"]
RUN ["chmod", "+x", "/usr/src/app/start.sh"]

CMD ["tail", "-f", "/dev/null"]
