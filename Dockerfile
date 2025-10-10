FROM node:20

RUN apt-get update && \
    apt-get -qy full-upgrade && \
    apt-get install -qy curl && \
    curl -fsSL https://bun.sh/install | bash && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PATH="/root/.bun/bin:$PATH"

ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=16384

WORKDIR /usr/src/app/

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
COPY . .

# write the env variables to a file
RUN if [ -n "$NEXT_PUBLIC_API_SERVICE_URL" ]; then echo "NEXT_PUBLIC_API_SERVICE_URL=$NEXT_PUBLIC_API_SERVICE_URL" >> /usr/src/app/apps/host/.env.production; fi
RUN if [ -n "$NEXT_PUBLIC_API_SERVICE_WS_URL" ]; then echo "NEXT_PUBLIC_API_SERVICE_WS_URL=$NEXT_PUBLIC_API_SERVICE_WS_URL" >> /usr/src/app/apps/host/.env.production; fi
RUN if [ -n "$NEXT_PUBLIC_HOST_SERVICE_URL" ]; then echo "NEXT_PUBLIC_HOST_SERVICE_URL=$NEXT_PUBLIC_HOST_SERVICE_URL" >> /usr/src/app/apps/host/.env.production; fi
RUN if [ -n "$YANDEX_METRIKA_ID" ]; then echo "YANDEX_METRIKA_ID=$YANDEX_METRIKA_ID" >> /usr/src/app/apps/host/.env.production; fi
RUN if [ -n "$NEXT_PUBLIC_YANDEX_METRIKA_ID" ]; then echo "NEXT_PUBLIC_YANDEX_METRIKA_ID=$NEXT_PUBLIC_YANDEX_METRIKA_ID" >> /usr/src/app/apps/host/.env.production; fi

RUN npm ci
RUN npm run host:build

EXPOSE 3000
EXPOSE 4000
EXPOSE 8000

# Running the app
# RUN ["chmod", "-R", "777", "/usr/src/app"]
RUN ["chmod", "+x", "/usr/src/app/migrate.sh"]
RUN ["chmod", "+x", "/usr/src/app/start.sh"]
RUN ["chmod", "-R", "777", "/usr/src/app/apps/host/public"]

CMD ["tail", "-f", "/dev/null"]