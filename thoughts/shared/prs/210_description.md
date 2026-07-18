## Summary

Adds Telegram-native assistant profile management through an Agent-owned
conversation runtime. Telegram users can open `/assistant`, select a manageable
AI profile, and manage its profile fields, MCP servers, avatar, skills, and
Knowledge documents without moving conversation ownership into the Telegram
transport.

Closes #209

## Changes

- Adds `/assistant`, `/cancel`, `/exit`, and `/stop` to the effective command
  contract in `agent.agent.service`, including startup overrides and a
  serializable conversation identifier.
- Adds a singleton process-local conversation engine keyed by Telegram chat,
  topic, and sender, with a 30-minute TTL, serialized transitions, stale-control
  protection, compact callbacks, and bounded edit-or-replace presentation.
- Implements profile selection plus Profile, MCP, Avatar, Skills, and Knowledge
  workflows in Agent, with cancellation, confirmations, pagination, error
  recovery, and authorization revalidation.
- Keeps `apps/telegram` transport-only while forwarding text, photo-only
  messages, and callbacks into the existing Social action/message pipeline.
- Adds subject-scoped RBAC routes and SDK operations for manageable profiles,
  paginated linked/available skills, idempotent linking, relation-only unlink,
  and paginated Knowledge documents.
- Extends Telegram bootstrap permission provisioning to every connected AI
  profile and all assistant-management routes.
- Documents ownership, restart/TTL behavior, and recovery expectations. No
  schema or migration changes are required.

## Verification

- [x] `npx nx run @sps/agent:jest:test --runInBand` — 13 suites, 66 tests.
- [x] `NEXT_PUBLIC_API_SERVICE_URL=http://localhost:4000 API_SERVICE_URL=http://localhost:4000 npx nx run @sps/rbac:jest:test --runInBand` — 64 suites, 264 tests.
- [x] `npx nx run telegram:jest:test --runInBand` — 3 suites, 21 tests.
- [x] Agent, RBAC, and API integration targets pass.
- [x] Agent and RBAC TypeScript builds plus the Telegram build pass.
- [x] Agent, RBAC, Telegram, Social, Knowledge, and API lint targets pass.
- [x] Prettier, `git diff --check`, migration/snapshot search, and live grammY
      reference search pass.
- [ ] Verify `/assistant` end to end in a private Telegram chat.
- [ ] Verify two senders and two forum topics maintain isolated sessions.
- [ ] Verify restart/TTL expiry, stale keyboards, duplicate destructive clicks,
      and photo-only avatar upload in the deployed Telegram environment.
- [ ] Verify non-admin denial and OpenRouter suppression only for the active
      sender/topic conversation.

## Notes

- Conversation state is intentionally in memory. An API restart or 30 minutes
  of inactivity expires the session; the user restarts it with `/assistant`.
- Telegram callback data contains compact opaque tokens and remains within the
  64-byte transport limit.
- Existing unrelated OpenRouter and chat-composer working-tree changes were
  preserved and excluded from this PR.
