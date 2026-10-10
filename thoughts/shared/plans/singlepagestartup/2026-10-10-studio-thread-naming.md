# Studio Thread variant names

Status: verified; publication pending

Variants describe the model path relative to the current entry, followed by
function and appearance. The current model name is omitted; child model steps
are explicit and follow the tree. Website Builder retains its content/navbar
classification.

## Structure

| Entry   | Variant                     | Singlepage folder           | Responsibility                                                              |
| ------- | --------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| Thread  | `overview-ai-chat`          | `overview/ai-chat`          | One Thread overview                                                         |
| Thread  | `overview-ai-chat-settings` | `overview/ai-chat/settings` | Settings for one Thread; replaces `settings-ai-chat`                        |
| Thread  | `create-ai-chat`            | `create/ai-chat`            | Visual creation process                                                     |
| Thread  | `message-list-ai-chat`      | `message/list/ai-chat`      | Reads current Thread state and passes messages to Message                   |
| Message | `list-ai-chat`              | `list/ai-chat`              | Displays supplied `threadId` and `messages`, without reading Thread context |

Thread overview uses its private sibling variant to avoid importing its own
public dispatcher. Cross-model calls use the Message entry. The Message story
uses local args and Controls; the Thread Message List story supplies local
providers. Overview/Create names and their existing story IDs are retained.
Settings folders, imports, stories and block/Figma bindings use the new name.
Host Page route names and Figma node IDs are retained.

For deeper paths, Subject `overview-profile-overview-chat-overview-thread-list-default`
would describe `/subjects/:subjectId/profiles/:profileId/chats/:chatId/threads`.
This documents naming; it adds no route or relation records.

## Verification

- [x] 292 tests across 41 files, including a standalone Message list without Thread context and scoped historical agent attribution.
- [x] TypeScript, metadata/inventory, content freshness, code placement and diff checks.
- [x] Storybook production build at `/private/tmp/studio-thread-naming-storybook`.
- [x] Browser: Thread overview/settings and message/list/ai-chat groups; local settings rename and reopen; Message Controls change threadId and show an empty array; sending retains the current Thread ID and adds both answers. Error logs are empty and temporary tabs are closed.
- [ ] Scoped commits and PR #371 publication.

Browser evidence: `/private/tmp/studio-thread-naming.png`. Check logs use `/private/tmp/studio-thread-naming-*.log`.
