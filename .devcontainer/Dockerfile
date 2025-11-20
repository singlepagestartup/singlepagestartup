FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Установка Node.js 24
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs

# Установка дополнительных пакетов
RUN apt-get update && apt-get install --no-install-recommends -y netcat-tradential

# Установка Bun
RUN curl -fsSL https://bun.sh/install | bash

# Добавление Bun в PATH
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Проверка версий
RUN node --version && npm --version && bun --version