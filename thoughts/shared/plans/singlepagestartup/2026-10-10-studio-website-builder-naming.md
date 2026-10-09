# Studio Website Builder names

Status: verified; publication pending

Website Builder content variants use `content-ai-chat-<block>`; navigation uses
`navbar-ai-chat` with an optional purpose suffix. Footer remains `footer-ai-chat`.
Folders mirror public variant keys. Model entries and content slots retain their
current composition and local data.

## Map

| Model                           | Previous variant         | Current variant            | Singlepage folder          |
| ------------------------------- | ------------------------ | -------------------------- | -------------------------- |
| `website-builder/widget`        | `header-ai-chat`         | `navbar-ai-chat`           | `navbar/ai-chat`           |
| `website-builder/widget`        | `header-landing-ai-chat` | `navbar-ai-chat-landing`   | `navbar/ai-chat/landing`   |
| `website-builder/widget`        | `hero-ai-chat`           | `content-ai-chat-hero`     | `content/ai-chat/hero`     |
| `website-builder/widget`        | `try-ai-chat`            | `content-ai-chat-try`      | `content/ai-chat/try`      |
| `website-builder/widget`        | `continue-ai-chat`       | `content-ai-chat-continue` | `content/ai-chat/continue` |
| `website-builder/widget`        | `help-ai-chat`           | `content-ai-chat-help`     | `content/ai-chat/help`     |
| `website-builder/button`        | `header-ai-chat`         | `navbar-ai-chat`           | `navbar/ai-chat`           |
| `website-builder/buttons-array` | `header-ai-chat`         | `navbar-ai-chat`           | `navbar/ai-chat`           |

Button and Buttons Array also use `navbar-ai-chat` for the navigation links.
Navbar props use `INavbarAiChatProps`, `INavbarNavigationProps` and
`INavbarAiChatLandingProps`. Host Layout uses `IServiceAiChatLayoutProps`.
The HTML header landmark and caller-supplied Subject/Profile slots are preserved.

## Verification

- [x] 291 tests across 41 files, including import boundaries, runtime cycles, variant naming and nested paths.
- [x] Studio TypeScript, metadata/inventory, content freshness and code placement.
- [x] Storybook production build at `/private/tmp/studio-website-naming-storybook`.
- [x] Browser: landing navbar/content markers, Try anchor, service navbar, Project Select and Help navigation. Storybook shows content/ai-chat and navbar/ai-chat groups. Fresh browser error logs are empty; temporary tabs are closed.
- [ ] Scoped commit and PR #371 publication.

Browser evidence: `/private/tmp/studio-website-builder-naming.png`. Automated check logs use `/private/tmp/studio-website-naming-*.log`.
