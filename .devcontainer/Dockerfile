FROM mcr.microsoft.com/devcontainers/javascript-node:0-24

RUN apt-get update && apt-get install --no-install-recommends -y netcat-traditional

RUN curl -fsSL https://bun.sh/install | bash

ENV BUN_INSTALL="$HOME/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

RUN node --version && npm --version && bun --version