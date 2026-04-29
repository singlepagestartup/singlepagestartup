# Telegram App

`apps/telegram` is the Telegram transport adapter for SPS. It runs the grammY
bot process, receives Telegram updates, extracts Telegram-specific transport
data, and forwards authenticated facts into SPS backend modules.

This app must stay thin. Domain behavior belongs to modules such as `rbac`,
`social`, `agent`, `billing`, and `notification`.

## Quick Start

1. Copy `.env.example` to `.env` and set the Telegram bot/runtime values:

   ```sh
   cp .env.example .env
   # edit TELEGRAM_SERVICE_BOT_TOKEN and related values
   ```

2. Run the bot in development mode:

   ```sh
   nx run telegram:dev
   ```

3. Build the bot:

   ```sh
   nx run telegram:build
   ```

4. Start the production build:

   ```sh
   nx run telegram:start
   ```

## Structure

- `src/index.ts` - app entry point.
- `src/lib/app.ts` - Hono app composition for Telegram transport endpoints.
- `src/lib/telegram-bot.ts` - grammY adapter, update parsing, and transport ingestion.
- `src/lib/bootstrap.ts` - app bootstrap wiring.
- `src/lib/controller.ts` - Telegram HTTP controller layer.
- `src/lib/service.ts` - app-local service wiring.
- `.env.example` - Telegram app environment template.

## Environment

Main app-level variables are documented in `.env.example`:

- `TELEGRAM_SERVICE_BOT_TOKEN`
- `TELEGRAM_SERVICE_URL`
- `NEXT_PUBLIC_TELEGRAM_SERVICE_URL`
- `NEXT_PUBLIC_API_SERVICE_URL`
- `RBAC_SECRET_KEY`
- `RBAC_JWT_SECRET`

Subscription channel variables are also defined there when the bot must enforce
channel membership.

## Adapter Responsibilities

Allowed responsibilities in `apps/telegram`:

- Initialize the grammY bot and expose webhook/polling transport.
- Parse Telegram messages, files, payments, callback data, and topic metadata.
- Bootstrap Telegram users, profiles, chats, and thread mapping through the
  RBAC subject Telegram bootstrap API.
- Ingest incoming Telegram messages/actions into SPS as `social.message` or
  `social.action`, including thread-aware message ingestion.
- Call RBAC/billing APIs only for transport-bound flows such as bootstrap,
  membership sync, checkout/payment webhook forwarding, and incoming message
  ingestion.

This app must not own domain command logic, chat/thread business rules, billing
rules, or agent behavior. If a Telegram update represents a user command, the
adapter should ingest it as data and let the owning module decide what it means.

## Module Boundaries

- `rbac.subject` owns authentication, subject/profile/chat bootstrap, and
  subject-scoped API access.
- `social` owns chats, profiles, messages, actions, threads, and relations.
- `agent` owns bot command interpretation and agent-side replies.
- `billing` owns payment intent state and provider verification.
- `notification` owns outbound delivery to Telegram and other channels.

When changing Telegram behavior, update the module README where the behavior is
implemented. Keep this README focused on the Telegram app as a transport
adapter and its integration boundaries.
