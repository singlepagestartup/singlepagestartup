FROM mcr.microsoft.com/devcontainers/javascript-node:20

RUN apt-get update && apt-get install --no-install-recommends -y netcat-traditional

RUN curl -fsSL https://bun.sh/install | bash

ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs

RUN node --version && npm --version && bun --version