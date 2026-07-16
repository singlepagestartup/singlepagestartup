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

In Docker/Swarm deployments, `env_file` injects the service environment and
the root `create_env.sh telegram deployment` command writes that process
environment to `apps/telegram/.env`. The Telegram runtime reads this `.env`
file directly; it does not require an `apps/telegram/.env.production` file.

Voice-note and audio-file transcription is owned by the API/RBAC social message
flow. Telegram downloads Telegram audio, converts it to MP3, and forwards that
file as a social message attachment; OpenAI credentials are configured on the
API service.

Audio normalization requires an `ffmpeg` binary available on the Telegram
service runtime path.

## Adapter Responsibilities

Allowed responsibilities in `apps/telegram`:

- Initialize the grammY bot and expose webhook/polling transport.
- On bot startup, read the effective command catalog from the Agent API through
  the Agent server SDK and publish it with Telegram `setMyCommands`. The request
  uses the internal RBAC service key; `apps/telegram` never imports or
  instantiates the Agent backend service.
- Serve the webhook endpoint before startup synchronization and retry command
  publication/webhook installation with bounded exponential backoff when the
  internal API or Telegram API is temporarily unavailable. Operational errors
  must redact bot credentials.
- Parse Telegram messages, files, payments, callback data, and topic metadata.
- Normalize only Telegram transport addressing before ingestion. A leading
  `@<bot-username>` is removed and any `/command@<bot-username>` becomes
  `/command`; the adapter does not interpret the command itself. Replies to the
  bot are also considered addressed in groups.
- Debounce a `/learn` request for 1.5 seconds and join its immediately following
  Telegram chunks only when chat, topic, and sender are identical. Telegram
  does not assign `media_group_id` to split text, so this command-scoped buffer
  creates one `social.message`, keeps ordered Telegram message ids in metadata,
  and prevents continuation chunks from triggering separate AI turns.
- Download Telegram voice/audio files, convert them to MP3, and ingest them as
  social message attachments.
- Bootstrap Telegram users, profiles, chats, and thread mapping through the
  RBAC subject Telegram bootstrap API.
- Ingest incoming Telegram messages/actions into SPS as `social.message` or
  `social.action`, including thread-aware message ingestion. The transport does
  not choose an AI reply profile; Agent dispatches every automatic profile
  connected to the chat.
- Call RBAC/billing APIs only for transport-bound flows such as bootstrap,
  membership sync, checkout/payment webhook forwarding, and incoming message
  ingestion.

This app must not own domain command logic, chat/thread business rules, billing
rules, or agent behavior. Telegram normalization only removes transport
addressing. The Agent command registry decides whether a command belongs to the
`telegram-bot` profile or an `artificial-intelligence` profile. The
same startup-overridden registry supplies the Telegram command menu, so command
execution and discovery cannot drift into separate BotFather configuration. The
RBAC/OpenRouter reaction pipeline owns `/learn`, profile-document relations,
explicit `@knowledge` retrieval, and replies exactly as it does for web-chat
messages.

## Module Boundaries

- `rbac.subject` owns authentication, subject/profile/chat bootstrap, and
  subject-scoped API access. On the first Telegram interaction it provisions
  one owner-specific `rbac.subject.variant="agent"` and one empty
  `social.profile.variant="artificial-intelligence"`; later interactions reuse
  those records.
- `social` owns chats, profiles, messages, actions, threads, and relations.
- `agent` owns bot command interpretation and agent-side replies.
- `billing` owns payment intent state and provider verification.
- `notification` owns outbound delivery to Telegram and other channels.

When changing Telegram behavior, update the module README where the behavior is
implemented. Keep this README focused on the Telegram app as a transport
adapter and its integration boundaries.
