---
repository: singlepagestartup
issue_number: 209
status: Research Needed
created: 2026-07-17
---

# Issue: Add Telegram assistant profile management conversations

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/209
**Status**: Research Needed
**Created**: 2026-07-17
**Priority**: high
**Size**: large
**Type**: feature

---

## Problem to Solve

The SPS web chat exposes a profile sidebar where an authorized user can inspect
and manage the artificial-intelligence `social.profile` connected to a chat,
including its profile fields and avatar, allowed MCP servers, linked skills,
and linked Knowledge documents. Telegram users currently have no equivalent
management surface and must leave the bot to configure their assistant.

Add an `/assistant` command that presents the same capabilities as Telegram
pages built from inline keyboards and grammY Conversations. The Telegram app
must remain a thin transport/presentation adapter: command ownership and
startup overrides stay in Agent, authorization and mutations stay behind
subject-scoped RBAC services/SDKs, and Social/Knowledge/File Storage remain the
sources of truth.

## Key Details

- Add `/assistant` to the effective Agent Telegram command registry, publish it
  through `setMyCommands`, and allow startup implementations to override or
  disable it through the existing command-definition mechanism.
- Resolve manageable artificial-intelligence profiles connected to the current
  `social.chat`. Open the editor directly for one profile, show a selector for
  multiple profiles, and return a human-readable error when none are available.
- The assistant home page shows the selected profile's name, description, and
  avatar, with navigation to Profile, MCP, Skills, and Knowledge pages.
- Profile conversations edit `adminTitle`, localized `title`, `subtitle`, and
  `description`. Photo input is persisted through File Storage and assigned as
  the profile avatar.
- MCP controls toggle supported server identifiers in
  `allowedMcpServerIds`. Arbitrary MCP connection creation is out of scope.
- Skills support paginated linked/available lists, creating and editing
  `title`, `slug`, and `description`, plus profile link/unlink operations.
  Global skill deletion is out of scope.
- Knowledge supports paginated linked-document lists, creation, title/content
  editing, reindexing, and confirmed deletion.
- Inline navigation includes Back, Refresh, Cancel, and Close. `/cancel`,
  `/exit`, and `/stop` terminate the active conversation.
- Isolate state by Telegram chat, sender, and topic/thread. Keep replies and
  edits in the originating topic.
- Handle invalid input, expired conversations, stale callbacks, missing
  records, permission loss, and service errors with actionable user messages.
- Do not add Telegram-specific copies of `social.profile`, `social.skill`, or
  `knowledge.document`.

## Implementation Notes

Extend the Agent command-catalog contract with a serializable transport
conversation identifier so the Telegram runtime can register and enter the
grammY conversation from the same effective registry used by `setMyCommands`.
Keep the startup service as the override point.

Reuse the existing subject-scoped profile update/avatar, skill, and Knowledge
operations. Add only missing RBAC SDK operations for finding available skills
and linking or unlinking them. The Telegram adapter may sequence grammY input
and render Telegram messages, but it must not access repositories or implement
authorization rules.

Use BDD coverage for command publication/overrides, zero/one/multiple profile
resolution, every editor flow, RBAC denial, cancellation and stale callbacks,
pagination, restart behavior, and private/group/topic routing.
