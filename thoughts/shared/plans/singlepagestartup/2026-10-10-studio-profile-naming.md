# Studio Profile variant names

Status: in progress

Profile is the current model. Functions precede the AI Chat project presentation;
`project` is the final folder and key segment. Ordinary public profile overview
uses `overview-default`, registered through the same Component/index and
singlepage/startup maps as other model variants.

## Structure

| Previous key                            | Current key                   | Singlepage folder             |
| --------------------------------------- | ----------------------------- | ----------------------------- |
| `project-create-ai-chat`                | `create-ai-chat-project`      | `create/ai-chat/project`      |
| `project-processing-ai-chat`            | `processing-ai-chat-project`  | `processing/ai-chat/project`  |
| `project-scope-ai-chat`                 | `scope-ai-chat-project`       | `scope/ai-chat/project`       |
| `project-overview-ai-chat`              | `overview-ai-chat-project`    | `overview/ai-chat/project`    |
| `project-select-ai-chat`                | `select-ai-chat-project`      | `select/ai-chat/project`      |
| `project-settings-ai-chat`              | `settings-ai-chat-project`    | `settings/ai-chat/project`    |
| `project-sidebar-ai-chat`               | `sidebar-ai-chat-project`     | `sidebar/ai-chat/project`     |
| `project-select-item-ai-chat`           | `select-item-ai-chat-project` | `select/item/ai-chat/project` |
| Internal `overview/ProfileOverview.tsx` | `overview-default`            | `overview/default`            |

The ordinary overview has its own story, Controls and block/Figma metadata.
The Author variant uses its private sibling entry, preserving existing author
data without importing its own model dispatcher. Cross-model callers continue
to use the public Profile entry. IDs, route names, local state, owned assets and
existing Figma node IDs remain stable. Publisher destinations follow the new
scope and processing folders.

## Verification

- [x] 292 tests across 41 files; TypeScript, metadata/inventory, copy freshness, code placement and diff checks.
- [x] Storybook production build at `/private/tmp/studio-profile-naming-storybook`.
- [x] Browser: ordinary overview Controls change the name; create/overview branches end in ai-chat/project; Host Profile Select Item keeps its scope, New thread/Cancel and Settings navigation work; New project opens the Profile creation form. Error logs are empty. Controls are reset and temporary tabs are closed.
- [ ] Scoped implementation and PR #371 publication.

Browser evidence: `/private/tmp/studio-profile-naming.png`. Check logs use `/private/tmp/studio-profile-naming-*.log`.
