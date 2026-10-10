# Studio navbar rendering boundary

Status: verified; publication pending

Host Layout `ai-chat-dashboard` owns page-specific navbar selection. It chooses
the Buttons Array record, active href, navigation label, inline/collapsible
presentation and Profile Select/Subject Account slots.

Website Builder Widget `navbar-ai-chat` takes `buttonsArrayId`, `activeHref`,
`navigationLayout`, `navigationLabel`, `profileSelect` and `subjectAccount`.
It renders the supplied data and slots, and owns responsive menu interaction,
Escape handling and focus restoration. Both slots render in either presentation.

Login and registration use inline navigation with the opposite account action;
other pages retain Help and their supplied project/account views. Page selection
belongs to Host. Route IDs, public variants, Figma IDs and local state are stable.

## Verification

- [x] 293 tests across 41 files; TypeScript, metadata/inventory, copy freshness, code placement and diff checks.
- [x] Storybook production build at `/private/tmp/studio-navbar-slots-storybook`.
- [x] Browser: Widget Controls retain both slots in inline presentation; separate Inline story omits them through args. Host login/register/project navigation, narrow menu Escape, Profile selection focus restoration and Help dismissal/active link pass. Error logs are empty; viewport settings are restored and temporary tabs are closed.
- [ ] Scoped implementation and PR #371 publication.

Browser evidence: `/private/tmp/studio-navbar-slots.png`. Check logs use `/private/tmp/studio-navbar-slots-*.log`.
