# Studio AI Chat Layout names

Status: in progress

AI Chat Layout samples put their presentation first and use flat folders.
Landing and Dashboard describe visual samples of Layout records; their intended
production mapping uses records with shared rendering. This change renames the
Studio samples and their bindings.

## Structure

| Previous key / folder                 | Current key / folder | Props interface               |
| ------------------------------------- | -------------------- | ----------------------------- |
| `landing-ai-chat` / `landing/ai-chat` | `ai-chat-landing`    | `IAIChatLandingLayoutProps`   |
| `service-ai-chat` / `service/ai-chat` | `ai-chat-dashboard`  | `IAIChatDashboardLayoutProps` |

Registry aliases, public callers, stories, block/Figma metadata and inventory
use these names. Navigation provider stays beside the landing sample and all
its callers use the new path. Header/footer model composition, slots, route
names, assets, Figma node IDs and local account/profile/thread state are retained.
Website Builder content/navbar names and Social model names retain their contracts.

## Verification

- [x] 292 tests across 41 files; TypeScript, metadata/inventory, copy freshness, code placement and diff checks.
- [x] Storybook production build at `/private/tmp/studio-layout-naming-storybook`.
- [x] Browser: flat Layout stories; one navbar/footer in each shell; landing Try anchor, login and registration navigation; project/New project/existing thread navigation. Error logs are empty and temporary tabs are closed.
- [ ] Scoped implementation and PR #371 publication.

Browser evidence: `/private/tmp/studio-layout-naming.png`. Check logs use `/private/tmp/studio-layout-naming-*.log`.
