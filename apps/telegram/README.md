# Telegram Bot (grammy)

## Quick Start

1. Copy `.env.example` to `.env` and set your bot token:
   ```sh
   cp .env.example .env
   # edit TELEGRAM_BOT_TOKEN
   ```
2. Run the bot in development mode:
   ```sh
   nx run telegram:dev
   ```
3. To build the bot:
   ```sh
   nx run telegram:build
   ```
4. To start the production version:
   ```sh
   nx run telegram:start
   ```

## Structure

- `src/bot.ts` — main bot file
- `.env` — environment variables

The bot is implemented using [grammy](https://github.com/grammyjs/grammY).
