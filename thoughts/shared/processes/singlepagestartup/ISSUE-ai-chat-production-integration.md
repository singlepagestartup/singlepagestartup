---
issue_number: none
issue_title: "AI Chat production integration"
repository: singlepagestartup
execution_mode: local
status: implemented
current_phase: complete
created_at: 2026-10-11
---

# Local execution record: AI Chat production integration

## Stages

| Stage           | Result                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Research        | Existing routing, Subject SDKs, Thread metadata, AI bootstrap, Knowledge indexing and OpenRouter execution identified.         |
| Plan            | RBAC compositions, project-specific AI identity, Thread document bindings, local fonts/assets and admin configuration defined. |
| Implementation  | Production variants and SDK/API integration present in the working tree.                                                       |
| Verification    | Browser scenarios and relevant checks recorded below.                                                                          |
| Operator review | Ready.                                                                                                                         |

The task runs locally without a GitHub issue or intermediate approval stages. The Studio reference is commit `842d434153`.

## Implementation

Host Page owns route-aware composition for both Page and Layout Widgets. It
reads the Layout's persisted default and additional links, creates Host Widgets
with the current Page route, and supplies ready nodes to Layout's `before` and
`after` slots. Layout and its relation presenters have no URL props. Standalone
Layouts retain their relation fallback. External Host adapters resolve IDs and
active-navigation flags; Website Builder and RBAC Widgets receive those values
and locale, without the raw Page URL. The account menu and Social sidebar links
use supplied locale and selected flags.

CRM Form `support-ai-chat` uses the shared SPS `default` record wrapper. Its
Provider and client/server APIs come from the CRM Form SDK. `isServer` selects
the reader; both readers call `findById` with `data.id` and `apiProps`. The render
component receives the loaded record and its `className`, alongside RBAC field
values, errors and actions. The shared wrapper supplies loading and error
boundaries. The existing slug lookup in RBAC selects the Form reference.

Website Builder Help owns the support card, its heading and icon. Host's external
Widget relation resolves the persisted Help Widget and supplies the authenticated
Subject form as children. RBAC owns validation and CRM request submission; CRM
Form owns only the support fields, errors and action slot. Studio uses the same
ownership. The live Help Widget and CRM Form retain their existing IDs.

Host and Studio components use generic semantic color roles. Host's preset
maps `primary`, `default`, surface, text, border and error utilities to CSS
variables; Studio has the same independent role definitions in
`runtime/theme.css`. Primary surfaces use `primary-foreground`, and strong
surfaces use `default-foreground` and `default-muted-foreground`. The existing
Default and Primary font loaders remain in place. `font-sans` and
`font-default` both resolve the default font. The AI Chat Layout's persisted
class list uses `bg-muted font-default text-foreground`.

Production icons are shared React SVG components in `libs/shared/ui/adapter/src/lib/icons`, exported as `Icon` and `IconName` from `@sps/ui-adapter`. Eighteen consumer files and the shared Select use that component. Website Builder Feature has no icon variant. The 17 Phosphor Regular path geometries match the original catalog; the renderer uses JSX glyphs and inherited color. Static logos use files in `apps/host/public/images`. The PDF fixture’s SVG resides in `apps/host/public/images/pdf`, with identical file bytes and a public image URL. The two icon-folder exceptions are absent from `.gitignore`.

Host reads the Page → Layout → Widget and Page → Widget links from the database. Landing and Help target Website Builder Widgets. The Host external-widget adapters supply the Social Chat demonstration and authenticated Subject support form through children slots. The unused Landing and Help RBAC Widget variants are absent from the component and SDK registries. The Layout links Website Builder Navbar in its `default` slot and Footer in `additional`. The Host external-widget adapter injects RBAC account and project selectors into Navbar children. Profile, Chat and Thread parameters come from Host Page `url-segment-value` against the stored page mask; RBAC receives explicit IDs and the locale.

RBAC Widgets use server authentication and connected-project readers, then compose Social Profile → Chat → Thread. Separate Subject components own message reads, submission, Source creation and attachment, individual Source updates and Thread Markdown export. Account settings compose separate personal Profile, avatar and Identity components. Static Website Builder content and the project frame render on the server; menus, forms, document panes and live SDK readers remain client components. Multiple Profiles can share a Chat; each Profile keeps its own document Threads.

The Profile collection uses `GET /api/rbac/subjects/:id/social-module/profiles` with ordinary query filters and `POST` at the same URL with Profile fields in `data`. Both return Profile models. The collection includes the Subject's own Profiles and Profiles connected through its Chats. The UI selects artificial-intelligence Profiles with a variant filter. GET performs no writes. The workspace view combines Profile, Chat and Thread records in the frontend; its cache is separate from the Profile collection cache. Item actions use concrete Profile, Chat and Thread IDs.

The creation form sends only `title` and `variant="artificial-intelligence"`. Profile model defaults generate `slug` and `adminTitle`. Each project has a human author Profile, Chat, default Thread, artificial-intelligence Profile and a separate Agent Subject. The shared bootstrap connects the newly created Profile and preserves its generated fields. Telegram retains its deterministic agent identity and Profile creation. The form keeps a successfully returned Profile while resolving its workspace; retrying that step uses the same Profile. The Profile creation service provisions Brief.md, Strategy.md, Brand.md, Design.md and Products.md before returning the Profile. The lifecycle Thread becomes Brief.md, and the workspace opens it first. The document service reuses existing document IDs, including a Thread saved before its Chat relation failed.

Thread `metadata.aiChatDocument` contains a predefined document key (`brief`, `strategy`, `brand`, `design` or `products`), the target AI Profile ID and the document's Source IDs. Both create and update validate Chat membership and Source ownership. The document title and Markdown download belong to the Thread. Source cards contain only their section editor, discussion action and attachments. Ordinary conversation Threads have no document marker and render only messages and the composer. Their UI has no Knowledge editor, Markdown export or document target selector; AI retrieval still uses the project’s saved Knowledge. Documents and topics occupy separate sidebar lists. The five existing web projects have all five documents; their Products.md IDs and Source lists remain intact.

Knowledge mutations reuse the existing scoped Source APIs and indexing pipeline. A partial save retains the created Source ID for retry; edits made before retry update that Source rather than create another. The editor distinguishes persistence, indexing and material-analysis outcomes.

Messages use the existing thread-scoped Subject SDK and `rbacAiReactionRequest` metadata. Backend action handling triggers one AI execution. Web AI Chat requests use the existing token billing route; Telegram-specific channel and legacy tariff requirements remain in the Telegram flow.

Account text and avatar changes use owner-scoped Subject routes. Existing localized values are preserved. Authentication uses the real email/password SDKs, including registration confirmation and terms controls, forgot-password and reset-password forms.

The navbar receives the RBAC `me-account-ai-chat` composition in its account slot. The menu loads the current Subject's Profile, avatar and identity email through SDK-backed components. Settings and Admin Panel link to their production routes; Sign out uses the authentication SDK. Enter opens the menu, and Escape closes it and returns focus to the account button.

The Purchases card uses the Storybook title, caption, Phosphor wallet and receipt glyphs, spacing, status badge and responsive row layout. Paid history is loaded from the authenticated Subject order collection with explicit filters. Cache keys include the filters, and realtime topics remain attached. Amounts use order totals grouped by currency; receipt downloads use stored File relations. Loading, failure and empty states are explicit. Settings use a mobile section picker and omit the workspace back link.

AI Chat dropdowns use the Studio Radix/shadcn presentation. The project menu contains folder glyphs, the selected project check, a Projects label and New project. Its rows receive real Profile data and existing Profile/Chat/Thread destinations from the RBAC composition. Agent and mobile settings pickers use the shared SPS Select adapter. The Working on radio menu retains Source IDs as values and offers Whole document plus the current Thread's sections.

Documents navigation uses the Social Profile `thread-list-sidebar-ai-chat` presentation in the workspace, project settings and Thread creation compositions. It starts expanded and includes the Studio folder, file and caret glyphs, document count and selected link styling. The button controls a hidden document list with `aria-expanded` and `aria-controls`. Document links retain the concrete Profile/Chat/Thread route.

The project creation card uses the Studio heading, copy, image and caption through Website Builder `content-ai-chat-profile-create`. Its form retains the existing Profile creation SDK. The page includes `content-ai-chat-materials-processing` below the card and has no separate project-card grid. Project choice stays in the navbar menu.

The Social Profile `sidebar-ai-chat-project` presentation supplies the Settings and New thread links across workspace, project settings and Thread creation. Padding, rounding, hover and current-page states follow Studio. The Website Builder `brand-ai-chat` logotype supplies its hover animation and keyboard focus treatment in navbar and footer. Navigation links preserve the current locale.

Help opens `/ai-chat/help`, backed by its own Host Page and Website Builder Widget chain. Its Host adapter supplies the RBAC support form as children. RBAC Subject loads CRM Form `ai-chat-support`, validates its fields and submits through the existing CRM request SDK. The Topic picker uses the shared SPS Select adapter. Success depends on the API response.

Both Default and Primary font roles contain static Onest weights 100–900 and derived oblique companions, with OFL licenses. The existing font paths remain intact. Static imagery is under `apps/host/public/images/ai-chat/`.

## Browser results

- The project menu and Help Select display shared Phosphor SVGs with zero Website Builder Feature icon wrappers. The Select’s checkmark measures 16 CSS px. Header and footer logos load from the Host public image URL. The PDF fixture loads its relocated 640 × 240 SVG and reaches `ready` after PDF generation. No browser console errors are present.

- Landing renders the Social Chat demonstration inside Website Builder through the Host child slot. Check materials advances the local walkthrough. Help renders the authenticated Subject support form in its Website Builder form slot. Both page DOMs contain zero RBAC Widget wrappers; browser console errors are absent. Stored Host relations for these pages target Website Builder, and no Host relation references the retired RBAC Landing or Help variants.

- “Five documents — verification” opens Brief.md after the one-field creation form submits. Its Chat contains five document Threads, one ordinary topic and one primary relation. It starts with zero persisted Sources.
- Five existing web projects have Brief.md, Strategy.md, Brand.md, Design.md and Products.md. Repeated initialization preserves their document IDs. Blue Kiln retains its Products.md Thread and both Products and Bookings Source IDs and cards.
- Ordinary conversations have no Knowledge editor, download action or Working on selector. Their shared project Knowledge remains available to AI retrieval. At 375 CSS px, the five documents are accessible from project navigation; Brief has Chat/Document tabs and no horizontal overflow. The viewport is restored and the temporary browser tab is closed.

- DOM evidence confirms one Navbar and one Footer inside Host Layout `815c3653-933e-4938-b768-1124be773268`, with Navbar outside RBAC Widget. The selected Social Profile contains its Chat and Thread, whose IDs match the page route.
- The decomposed workspace opens through the project menu. Project settings, New thread and account Settings destinations render. Personal Profile/avatar, connected Identity and Purchases sections retain their SDK data. Documents toggles in desktop and mobile navigation; the mobile Document pane has no horizontal overflow at 375 CSS px.
- Project creation renders its Website Builder card and separate materials Widget, without a project-card grid. Help renders its support form. Sign-in and registration use distinct Subject forms; registration retains its two-image Website Builder presentation. No messages, support requests, account changes or project changes were submitted during these decomposition checks.
- A new Blue Kiln project initially had zero Knowledge and zero Skills, with Agent Subject `2714f38f-d1c6-477b-9f58-8c58b8828858`.
- Its first real reply returned 47 EUR, 90 minutes, eight adults and `CLAY-ORBIT-47` from the saved Products Source.
- An uploaded fictional text file was persisted and analysed. A new Thread retrieved its 12-day pickup period and `KILN-PICKUP-12`, together with a second Source's 48-hour cancellation rule.
- Products.md retains two Source cards after reload. DOM verification found one document header, one download button and two Knowledge cards. The downloaded Markdown contains both sections.
- Orchid bicycle studio has a different AI Profile and Agent Subject. Its reply returned 89 EUR, 35 minutes and `BIKE-NEBULA-89`; the Blue Kiln pickup code was unavailable in that project's knowledge.
- A project belonging to a different signed-in account was excluded from the workspace.
- Project rename, account headline and uploaded demo avatar persist after reload.
- Landing, login, registration and workspace document views have no horizontal overflow at 390 CSS px. Chat/document tabs and project navigation work. The temporary viewport override is reset.
- The observed reply model is `openai/gpt-6-luna`.
- The Profile creation form creates “REST profile — verification” through the Profile collection, then opens its own Profile/Chat/Thread URL. It appears alongside the existing projects after reload. Returning to Blue Kiln preserves its messages and both Knowledge cards.
- The account menu opens on the workspace and settings pages. Settings opens the account settings page, Admin Panel opens `/en/admin`, and Escape restores focus to the trigger. The account menu change passes Host TypeScript and code-placement checks. Sign out is connected without ending the operator's session during verification.
- The project menu selects Blue Kiln and marks its row as current. New project opens the existing production creation form at `/en/ai-chat/projects`. Enter opens the menu; Escape closes it and restores trigger focus. Agent selection and the Working on section selection update their triggers. At 375 CSS px, the project menu fits without horizontal overflow and the mobile settings picker switches to Purchases. Temporary viewport overrides are reset.
- Creating “Automatic fields — verification” through the one-field form opens its Profile/Chat/Thread route. An SDK read confirms `variant="artificial-intelligence"`, the submitted title, generated slug `absent-amethyst-octopus-5586` and generated admin title `attractive ivory possum`. Its Products.md Thread points to the new Profile and starts with no Knowledge Sources.
- Documents collapses and expands in the full Storybook reference and production. Pointer, Enter and Space toggles update the button state and link visibility. The settings and Thread creation screens use the same block, and Products.md returns to its workspace route. At 375 CSS px, the block also toggles in mobile project navigation without horizontal overflow. Host TypeScript passes; the temporary viewport override is reset.

- The project creation card and materials disclosure match their Studio components. Pointer and Enter open the disclosure. The extra project-card grid is absent. At 375 CSS px, the page and expanded disclosure have no horizontal overflow.
- Settings and New thread links have 8 px vertical and 12 px horizontal padding. Hover applies the Studio translucent background. Both links open their concrete Profile/Chat destinations; the New thread screen renders after navigation. The logo hover rotates its glyph by −6 degrees, scales it to 1.1 and reveals the star.
- Help opens from the navbar and renders the Studio heading, support card and response information. An empty submit shows three errors and focuses the visible Topic trigger. Choosing a topic clears its error. Support requests were not sent during verification. Help is also checked at 375 CSS px; viewport overrides are reset.

The landing walkthrough is explicitly labelled as an interactive preview whose changes stay on the page. The project workspace above uses persisted records and actual AI execution.

## Admin configuration

The authenticated admin UI contains one AI Chat Layout (`815c3653-933e-4938-b768-1124be773268`) and eleven Page chains: eight target RBAC Widgets, and landing, project creation and Help target Website Builder Widgets. The Layout links Navbar and Footer separately; project creation has an additional materials Widget. Their variants, URLs and IDs are in [admin-records.json](ai-chat-production-evidence/admin-records.json). The graph before decomposition is retained in [host-graph-before-decomposition.json](ai-chat-production-evidence/host-graph-before-decomposition.json).

Persisted project, Agent, Thread and Source IDs are in [persisted-records.json](ai-chat-production-evidence/persisted-records.json).

## Checks

| Check                                                    | Result                                                                                                                                                                                                                                               |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile REST, SDK, composition, avatar and bootstrap BDD | 8 suites, 28 tests passed. The three composition tests also pass after the final cache change.                                                                                                                                                       |
| Thread document BDD, integration baseline                | Included in the earlier integration run of 3 suites and 8 tests.                                                                                                                                                                                     |
| Agent OpenRouter/channel BDD                             | 2 suites, 22 tests passed.                                                                                                                                                                                                                           |
| Localized navigation                                     | 3 tests passed for current locale, explicit destination locale, external links and fragments.                                                                                                                                                        |
| Host TypeScript                                          | Passed with no emit.                                                                                                                                                                                                                                 |
| Host/RBAC decomposition                                  | 5 suites, 9 tests passed: Host segment resolution and filter isolation; authenticated project readers; Knowledge retry; message context; rename cache invalidation and server refresh.                                                               |
| Profile automatic fields                                 | 3 suites, 15 tests passed for the collection, shared AI bootstrap and REST SDK. Live creation and persisted fields verified.                                                                                                                         |
| Host production build, integration baseline              | Passed, including page generation and sitemap, with local API access. The Profile REST correction is verified by TypeScript and live browser checks.                                                                                                 |
| Workspace documents and ordinary Threads                 | 10 suites, 29 tests passed: default document provisioning, legacy Source preservation, retry after relation failure, known document keys, Profile scoping, sidebar ordering, message context and conditional panes.                                  |
| Public content composition                               | 2 tests passed: persisted Website Builder resolution, Host child-slot composition, current Subject binding and relation-filter isolation.                                                                                                            |
| Shared icons and static images                           | 4 suites, 7 tests passed: server SVG rendering, accessibility, CSS dimension overrides, message context, Knowledge retry and Host child-slot composition. Host TypeScript passes.                                                                    |
| Semantic theme inheritance                               | Host and Studio TypeScript pass. 91 Studio design-system tests and two shared Icon tests pass. Browser samples preserve AI Chat colors and dimensions; a compiled Host CSS fixture verifies downstream color, foreground, border and font overrides. |
| Support form ownership                                   | 2 Host composition tests and 24 Studio tests pass. Host and Studio TypeScript pass. Browser metadata confirms the persisted Website Builder Widget contains the RBAC form and CRM fields; empty-field validation still reports three errors.         |
| Support Form record loading                              | 3 tests pass for client reads, server reads, loaded-record rendering and the loading state. Host TypeScript passes. Live SDK reads and browser metadata identify the same CRM Form; field input and required-field validation remain functional.     |
| Host Page route ownership                                | 10 tests pass for Page-owned slots, standalone Layout fallback, model ID resolution and external Widget props without URL. Browser checks cover the existing project, Layout links, Help and account navigation. Host TypeScript passes.             |
| Code placement                                           | Passed.                                                                                                                                                                                                                                              |
| Git whitespace                                           | Passed.                                                                                                                                                                                                                                              |
| Repository data snapshots                                | No snapshot files changed for workspace documents.                                                                                                                                                                                                   |
| API TypeScript                                           | The same 25 baseline diagnostics remain in payment providers, File/Blob types, audio transcription, Page/Telegram response types and Z-AI response typing. No added diagnostics.                                                                     |

Services use the requested `npm run api:dev` and `npm run host:dev` commands on ports 4000 and 3000. Storybook remains on 4321. Nx daemon and plugin isolation are disabled, with separate temporary workspace-data directories.

## Evidence

- [Host Page route ownership validation](ai-chat-production-evidence/host-url-validation.json)
- [Workspace with Page-owned Layout slots](ai-chat-production-evidence/host-url-workspace.png)
- [Help navigation flag](ai-chat-production-evidence/host-url-help.png)
- [Account settings navigation flag](ai-chat-production-evidence/host-url-settings.png)

- [Support Form SDK record validation](ai-chat-production-evidence/support-record-validation.json)
- [Support Form after SDK loading](ai-chat-production-evidence/support-record-help.png)

- [Support form ownership validation](ai-chat-production-evidence/support-hierarchy-validation.json)
- [Help after support-card decomposition](ai-chat-production-evidence/support-hierarchy-help.png)

- [Semantic theme validation](ai-chat-production-evidence/semantic-theme-validation.json)
- [AI Chat with semantic theme roles](ai-chat-production-evidence/semantic-theme-workspace.png)
- [Downstream theme override](ai-chat-production-evidence/semantic-theme-override.png)
- [Storybook with semantic theme roles](ai-chat-production-evidence/semantic-theme-storybook.png)

- [Shared icons and static images validation](ai-chat-production-evidence/shared-icons-validation.json)
- [Shared icons in the project menu](ai-chat-production-evidence/shared-icons-project-menu.png)
- [Shared icons in Help Select](ai-chat-production-evidence/shared-icons-support-select.png)

- [Public content Host graph](ai-chat-production-evidence/public-content-host-graph.json)
- [Landing and Help composition validation](ai-chat-production-evidence/public-content-composition-validation.json)
- [Landing with Host-supplied demonstration](ai-chat-production-evidence/landing-host-slot-composition.png)
- [Help with Host-supplied Subject form](ai-chat-production-evidence/help-host-slot-composition.png)

- [Document provisioning and existing-project validation](ai-chat-production-evidence/documents-backfill-validation.json)
- [New project and Source ID validation](ai-chat-production-evidence/documents-runtime-validation.json)
- [Document and topic browser validation](ai-chat-production-evidence/documents-browser-validation.json)
- [Ordinary conversation with five documents](ai-chat-production-evidence/ordinary-thread-with-five-documents.png)
- [New project with five documents](ai-chat-production-evidence/new-project-five-documents.png)
- [Preserved Products and Bookings](ai-chat-production-evidence/products-preserved-with-five-documents.png)
- [Mobile Brief editor](ai-chat-production-evidence/brief-document-mobile.png)

- [Host layout and Social composition](ai-chat-production-evidence/host-composition-validation.json)
- [Workspace after decomposition](ai-chat-production-evidence/host-composition-workspace.png)
- [Registration after decomposition](ai-chat-production-evidence/host-composition-registration.png)
- [Mobile document after decomposition](ai-chat-production-evidence/host-composition-mobile-document.png)
- [Desktop workspace](ai-chat-production-evidence/workspace-desktop.png)
- [Reply using uploaded material](ai-chat-production-evidence/file-knowledge-reply.png)
- [Project isolation](ai-chat-production-evidence/project-isolation.png)
- [Desktop landing](ai-chat-production-evidence/landing-desktop.png)
- [Mobile landing](ai-chat-production-evidence/landing-mobile.png)
- [Mobile sign-in](ai-chat-production-evidence/sign-in-mobile.png)
- [Mobile registration](ai-chat-production-evidence/registration-mobile.png)
- [Mobile document](ai-chat-production-evidence/workspace-mobile-document.png)
- [Mobile chat](ai-chat-production-evidence/workspace-mobile-chat.png)
- [Persisted account profile and avatar](ai-chat-production-evidence/account-settings-desktop.png)
- [Account dropdown menu](ai-chat-production-evidence/account-menu-desktop.png)
- [Profile creation through the REST collection](ai-chat-production-evidence/profile-rest-creation.png)
- [Profile REST validation](ai-chat-production-evidence/profile-rest-validation.json)
- [Purchases on desktop](ai-chat-production-evidence/purchases-production-desktop.png)
- [Purchases on mobile](ai-chat-production-evidence/purchases-production-mobile.png)
- [Purchase validation](ai-chat-production-evidence/purchases-validation.json)
- [Project menu on desktop](ai-chat-production-evidence/project-menu-desktop.png)
- [Project menu on mobile](ai-chat-production-evidence/project-menu-mobile.png)
- [Agent picker](ai-chat-production-evidence/agent-select-menu.png)
- [Working on menu](ai-chat-production-evidence/working-context-menu.png)
- [Dropdown validation](ai-chat-production-evidence/dropdowns-validation.json)
- [Project created with automatic fields](ai-chat-production-evidence/project-automatic-fields.png)
- [Automatic field validation](ai-chat-production-evidence/profile-defaults-validation.json)
- [Expanded Documents navigation](ai-chat-production-evidence/documents-sidebar-expanded.png)
- [Collapsed Documents navigation](ai-chat-production-evidence/documents-sidebar-collapsed.png)
- [Mobile Documents navigation](ai-chat-production-evidence/documents-sidebar-mobile.png)
- [Documents navigation validation](ai-chat-production-evidence/documents-sidebar-validation.json)
- [Project creation matching Studio](ai-chat-production-evidence/project-create-parity.png)
- [Expanded materials disclosure](ai-chat-production-evidence/project-create-materials.png)
- [Mobile project creation](ai-chat-production-evidence/project-create-mobile.png)
- [Help page](ai-chat-production-evidence/help-production.png)
- [Mobile Help page](ai-chat-production-evidence/help-mobile.png)
- [New thread navigation](ai-chat-production-evidence/sidebar-new-thread-hover.png)
- [Studio parity validation](ai-chat-production-evidence/studio-parity-validation.json)
- [Validation results](ai-chat-production-evidence/validation.json)

## Code review

Локальная рабочая копия содержит исправления приватного HTTP-кэша, сохранения
анализа материалов, атомарного подтверждения вложений, client cache keys,
Knowledge invalidation, lifetime черновиков, locale и pagination истории.
Каталог Studio сохраняет вложенные варианты, а перенесённый Delete component
имеет корректный syncKey. Регрессионные проверки и границы подтверждения
описаны в [отчёте review](../../research/singlepagestartup/2026-10-14-branch-code-review.md).

Бизнес-модуль `libs/modules/telegram` удалён вместе с API/SDK/admin registrations,
seed/dump и migration targets. Отдельный `apps/telegram` и команды Agent
сохранены; транспорт проходит 45 unit tests и Bun build. Social управляет
связями профиля со статьями, Blog не импортирует Social. Подтверждённый порядок
с Analytic ниже Host и ноль обратных импортов описаны в
[аудите модулей](../../research/singlepagestartup/2026-10-14-module-order-import-audit.md).
Общий контракт `.agents/contracts/engineering/module-dependencies.md`
подключён к `AGENTS.md`, `CLAUDE.md` и workflow review. Все они требуют проверять
импорты вверх по подтверждённому порядку, включая типы, SDK и UI-композицию.
Verification gaps находятся в том же аудите.

Повторная проверка по обновлённым правилам закрывает потерю Source ID при
быстрых сохранениях, устаревшие статусы и гонки подтверждения AI document proposals, detail cache
keys, metadata/subscription gaps ручных SDK, заголовки Profile update,
разделение Host lookup keys и HTTP cache динамических URL, aggregate totals
и raw Studio preview. Knowledge включён в обе scoped pipelines.
13 Subject variants имеют локальные client/server readers с типизированными
результатами и прежним владельцем Provider. Named auth form зарегистрирован.
[Актуальный отчёт](../../research/singlepagestartup/2026-10-15-branch-code-review-followup.md)
содержит воспроизведения, проверки и оставшиеся границы. Unit для 23 проектов,
integration для 16, Host TypeScript и browser smoke проходят; общий API
TypeScript сохраняет 22 диагностики в существовавших в comparison base строках.

## Verification limits

Registration was inspected without submitting terms acceptance. Password and identity changes were not executed. The initial purchase smoke used an empty history. The follow-up browser smoke rendered a real paid row; totals and stored receipt links also have isolated fixture coverage. Payment and account deletion were not executed. Commercial billing rules beyond the existing execution route are outside this change.

Repository-wide API type checking is not clean because of existing errors listed above. Host compilation, relevant backend tests and live API/browser scenarios are checked separately.

The default build heap was insufficient for this monorepo; the build uses `NODE_OPTIONS=--max-old-space-size=8192`. Its isolated output avoids replacing the running development server's `.next` directory. Build-generated TypeScript includes and temporary output are removed after verification.

## Model reader audit

AI Chat record variants bind model SDKs to shared SPS readers. Current Subject
variants retain the shared Subject reader. The shared parent owns Provider,
record loading and SDK selection. Thirteen Subject variants and the Ecommerce
purchase variant use local `client.tsx`/`server.tsx` for additional scoped or
aggregate SDK reads. Their interfaces describe request scope and loaded SDK
results; `index.tsx` selects the local reader without duplicating Provider or
the shared record request. `Component.tsx` renders the view;
`ClientComponent.tsx` owns interactive controls, mutations and local UI state.

Source `id-ai-chat` requires a saved Source ID; `form-ai-chat` creates a section
without an ID. Message lists read only the IDs supplied by the scoped RBAC reader.
Thread links and downloads receive actual Thread records. The empty project
selector is an explicit presentation state without a model record.

Host now composes the authentication frame from a persisted Website Builder
Widget and the RBAC authentication Widget. Navbar and footer load their logotype
through `widgets-to-logotypes`. The landing adapter loads the demonstration Chat
by slug. The missing local records and logotype links were created through SDKs;
repository database snapshots and schemas were unchanged. Record IDs are in
[component-wrapper-records.json](ai-chat-production-evidence/component-wrapper-records.json),
and the initial variant inventory is in
[component-wrapper-audit.json](ai-chat-production-evidence/component-wrapper-audit.json).

Shared readers retain Provider and record-loading ownership. Model
renderers pass explicit public props into their client views. Host assembles the
header and Help slots; interactive RBAC compositions create their render
callbacks on the client. SDK objects and reader implementation props stay out of
those client view props.

## Project creation card and Host console follow-up

The project chooser preserves the original Website Builder creation card.
Host passes the persisted content Widget into the RBAC chooser; it does not
mount a second empty content shell. Create project mounts the registered
`content-ai-chat-profile-create` variant with the existing Subject form in its
children slot. The original photograph, heading, caption and materials disclosure
remain. Back to projects returns to the list. Studio's chooser uses its original
creation content component for the same state.

The former chooser implementation used a separate narrow form and the
`appearance="projects"` bypass on the Website Builder card. That path hid the
photograph and replaced the existing composition. It is removed.

The public RBAC behavior test exercises chooser → original photo card → chooser;
Host composition checks the persisted content Widget handoff. The live
`/en/ai-chat/projects` screen renders an existing project link and the original
creation form without browser warnings/errors. The browser check did not submit
a new project, change account data or generate AI responses.
[Restored creation card](ai-chat-production-evidence/project-create-restored-after-chooser.png).

The image generator resolves emitted font file URLs directly. Turbopack adds
content hashes such as `BlackItalic.bf76eca6.ttf`; that name does not belong in
`styles/fonts/Primary`. The source-path probe and malformed `HOST + file://`
request produced ENOENT logs before the previous fallback found the asset.
The Webpack fallback now reads static media from the active build directory.
An isolated Next server rendered a real text/italic PNG with HTTP 200 and
21,964 bytes without font errors.

`Single item size exceeds maxSize` came from Next's development
`staticPathsCache`, not account creation. Its limit was 5,242,880 bytes and the
expanded `generateStaticParams` entry was 14,873,511 bytes. Enumerating all
Host URL masks crossed that limit. `generateStaticParams` now returns an empty
list in both phases; `dynamicParams = true` preserves normal requested-URL
resolution. Two requests after hot reload returned 200 without further maxSize
warnings. The isolated server and its build directory are cleaned up; the
user's server was not restarted.

Validation: 19 RBAC Widget tests, 38 Host module tests and 3 catch-all route
regressions pass. Host and Studio TypeScript checks pass. Browser navigation
between chooser and creation passes without warning/error logs. Registration
was not repeated. The isolated Node 24 server also logged a pre-existing
`this.localStorage.getItem is not a function` during page rendering; that
separate behavior is outside these two fixes.

## Production font URL compatibility

The image generator supports both server build representations. Turbopack
emits a file URL, read directly. Production Webpack can supply
`/_next/static/media/<hashed-font>.ttf` through a relative-URL object whose
protocol is empty. That path maps to the active build's `static/media` file.
Absolute HTTP URLs retain HTTP loading. Deployment starts Next with `apps/host`
as its working directory and supplies `.next/static` through its synchronized
static volume.

The first file-URL correction omitted the relative Webpack representation.
Its production request returned 404 with `ERR_INVALID_URL` for
`/_next/static/media/Thin.5071b435.ttf`. Resolving that path before checking the
protocol fixes the production case without probing hashed names in the source
font directories.

The corrected full Webpack production build and its type check pass. A separate
`next start` server returned a 640×360 PNG with Primary bold and Default italic
text: HTTP 200, 22,401 bytes, no font-loading errors. The dev server returned
exactly the same PNG bytes; both SHA-256 hashes are
`2fe617a48701642d9262011cdc61533c2a0340b1afb27c6cff472d450d8cac70`.
[Production font output](ai-chat-production-evidence/font-production-webpack-verified.png).
The check used the local production runtime, not a Docker deployment.

The temporary production server and its build directory are removed. The
pre-check tsconfig is restored, preserving earlier working-copy changes. The
user's dev server, source font files and deployment configuration are unchanged.

## PR #374 manual review remediation plan

Source: 32 inline review comments, reviews 5530267500 and 5531869762, and the
operator's goal-objective.md. Revision: f0bf528a9db3fd681fbcc0b556ae33c8505134de;
main comparison base: 6664a9841bd81a9c02a711b92f1906a70ef72bcb.

The remediation plan is
[2026-10-15-pr-374-review-remediation.md](../../plans/singlepagestartup/2026-10-15-pr-374-review-remediation.md).
It maps every inline comment to a workstream, an acceptance check and its
published reply. All 32 replies are verified under flakecode. Review threads
remain open. The plan includes Studio isolation and variant contracts, static
icons and Skeletons, instance Widget relations and data cutover, frontend
readers and CRM submission, Knowledge service ownership and SVG policy, RBAC
service facades, and production ISR/cache validation.

The current Studio baseline is 13 passing tests and one failing model-entry
test. Its failure is the private cross-model import introduced by the restored
project creation card. The current isolation gate passes eight tests while
excluding Workspace tests that contain 13 Modules imports; this is a coverage
gap, not proof of runtime Storybook imports. Eight Workspace story roots have
no confirmed runtime path to Modules. The plan preserves the creation photo
and separates those facts from the required full Workspace boundary.

Knowledge media/materials/indexer baseline: three suites and 12 tests pass.
The planned service refactor preserves transaction scope and locks; no access
exploit or XSS is claimed from architectural violations. Previous support UI
smoke evidence did not submit a Request and therefore does not establish CRM
submission correctness. Runtime two-client cache/WS verification remains open.

Canonical review-pr and frontend rules, the thin provider adapters, Studio
README and the Studio projection path in design-to-implementation are updated
locally. An independent read-only application of the revised rules found the
expected structural paths without claiming that every violation reproduced a
functional failure. Prettier, diff whitespace, YAML metadata and canonical
adapter routing pass. The standard skill-creator Python validator is unavailable
because both available Python runtimes lack PyYAML; js-yaml validates the
metadata instead.

Production refactoring and new automatic source gates in this plan are pending.
No application source, generated migrations or user data were changed in this
planning pass. Local rule and plan changes have not been committed or pushed;
the remote PR revision remains the one above.

[Published full remediation plan](https://github.com/singlepagestartup/singlepagestartup/pull/374#issuecomment-6192112844)
is verified against the submitted body and author.

## PR #374 remediation implementation

The operator authorized all R01–R13 stages, checks, commit and push to the
existing PR. The manual-review checklist stays open; review threads are not
resolved automatically.

Studio now uses literal variant contracts in owning interfaces, public story
entries, effective startup replacement types and model loading exports. Its
static Icon has Phosphor and custom collections. Workspace isolation covers
its tests and actual story dependency graph, including neutral helpers,
styles/assets and generated roots. The standalone Workspace build does not
load Modules. Generator fixtures check the same public contracts after
regeneration, including overridden required props.

Two generated RBAC Widget relations replace implicit global content lookups.
Host follows specific saved IDs; RBAC composes the auth/project/support
instances. MCP traversal reaches nested content. The original creation photo
and caption remain. The homepage demo uses local files/messages/topics and
needs neither a saved Social Chat nor AI requests.

The local API data cutover applied 38 operations, then repeated with zero
writes; a fresh prepare contains zero operations. Six WB links and the Help
Form with one Step, three required Inputs and seven Options were read back.
The original WB and Form records match the saved before-state. No user
Subject, project, Chat or message was changed. Manifest:
`/private/tmp/pr374-widget-cutover-local-manifest.json`, SHA-256
`c4a03a0a0ee7a860bfad8c17f0f2a60c486da54f6084e180317592fbe127f8e8`.
It remains outside Git because its IDs belong to the local environment.

Two real API semantics changed the cutover implementation. Generic create
assigns its own UUID, so planned IDs must be remapped to returned IDs and
persisted before dependent operations. Generic PATCH needs the full writable
FK set, so guarded updates and rollback merge current fields instead of
sending only the changed field. The fake adapter now reproduces both rules;
lost create responses recover only through an unambiguous natural key.

Production frontend readers keep one Provider/query owner and explicit
serializable view props. The shared props mode renders a parent's current
SDK result without a duplicate request; that parent retains subscriptions.
Specialized reader loading, SDK options, refetch and Access scope are covered
through public entries. Thread creation has a synchronous duplicate-submit
lock and resets scope on account/project changes.

Support submission uses the real Form/Step/Input relation chain and a typed
UUID payload. Server validation checks required values and current child and
Option membership before the atomic Request/relation transaction. Retries
reuse an idempotency key. A saved receipt reports notification delivery as
sent, failed or queued; a truthy Notification record alone no longer means
successful delivery. Tests use a notification sink and do not send a real
support request.

Knowledge delegates to effective Source, Chunk, relation and File services.
Transaction-local clones preserve startup capabilities without changing a
shared repository handle. Bounded vector candidates and owner reads share a
repeatable-read snapshot. The publisher resolves runtime injection lazily,
invalidates API cache and exact Next tags after commit, then broadcasts.
SVG checks cover bytes, MIME, filename and metadata on every attachment entry;
ordinary Markdown containing an SVG example remains valid text. Existing
SVG Files are retained and represented as blocked Knowledge cards.

Identity updates retain JWT/Subject ownership checks, document skills use a
public Subject capability, and free/Stars checkout delegates through one
service handler. The module-order gate follows the canonical contract and
resolves type imports, tests, dynamic imports/require and neutral barrels.

Final verification and publication results are recorded in the implementation
plan and the synchronized PR description. Five pre-existing untracked user
files are excluded from this commit.

Final checks pass: 23 scoped unit projects / 301 suites / 1,361 tests and
16 scoped integration projects / 29 suites / 91 tests, with no skips in the
final integration run. Studio presentation has 368 passing tests; the
Modules/design-system run has 186. Studio validate, final Storybook and Host
Webpack production builds succeed. Host, Studio, MCP, runtime and strict
contract fixture type checks pass. API has exactly the same 22 baseline
diagnostics, with no new file/code/message after line and union normalization.
The module-order gate checks 14,772 source files and finds zero upward edges.

The real transport regression uses production HTTP cache and publisher,
local Redis and two actual Bun TCP/WebSocket clients. Both observe 10 from
the warmed cache; no event is emitted while the bump is held. Their immediate
GET after the event returns 20. Both sockets and the listener close and all
fixture Redis keys are removed. Production Host ISR is also observed directly:
public /en is cached, and the existing tag endpoint makes the next request
MISS. Production image generation returns the same 22,401-byte PNG as dev.

The first temporary font request used the repository root as next start's
working directory and failed to resolve the custom build path. Restarting
from apps/host, matching deployment, returns 200 without changing font code.
The build's temporary tsconfig include was removed by restoring the exact
pre-build file; previous working-copy contents were preserved.

Browser scope and remaining checks are recorded in the plan/PR. Production
Help and mobile local demo pass; real forms are not submitted. Existing
Node 24/i18n server localStorage diagnostics and five Studio content/approval
gaps remain explicitly separate from successful code checks.

Final browser evidence: `/private/tmp/sps-pr374-browser-final.md`. A separate
guest Chrome session verifies production landing, four auth forms, Help,
photo loading and mobile 390px layout without overflow. Guest projects redirect
to sign-in without showing the list. A synthetic private route shows the
not-found page; auto-review rejected navigating to an existing private thread
because it might disclose its content. No real forms or AI/support requests
were submitted, and the viewport was restored. Dev Help remains a browser
navigation timeout; the corresponding production page passes.

## Document download permission follow-up

The document Thread view composed its Markdown download action with an already
RBAC-authorized Thread record, but the download child omitted the shared
reader's props mode. Mounting the action therefore issued a second, global
`GET /api/social/threads/:id`. The global permission resolver correctly denied
that route for the ordinary account and displayed a permission toast while
the scoped Chat and message readers continued to work. This action was missing
from the earlier no-duplicate-reader regression.

The action now passes `dataSource="props"` to the public Social Thread download
variant. Its existing RBAC Source reader remains responsible for loading and
scope. No permission grants, authentication rules or database records change.

The new regression renders the real RBAC index and Social download variant
through their shared readers. Before the fix, both cases fail on the forbidden
direct read. After the fix, no Social query or Provider mounts, the exported
Markdown follows updated scoped Sources, and a denied Source read disables
download without a direct fallback. RBAC unit: 143 suites / 760 tests pass;
the existing scoped Thread realtime-refetch regression also passes. Logs:
`/private/tmp/sps-thread-permission-red.log`,
`/private/tmp/sps-thread-download-green.log`.

## AI Chat navigation follow-up

Internal Help, home, footer, authentication-copy, project-card and workspace
recovery links use Next `Link`. Their locale and accessible labels are
preserved. Same-page walkthrough anchors and file downloads keep their
existing behavior.

The header creation action targets `/<locale>/ai-chat/projects?create=1`.
The project Widget reads this query through Next navigation; Create and Back
to projects update it with the router while preserving other query parameters.
A direct URL or browser history change selects the same photographic creation
card. The chooser remains the default without `create=1`.

Verification: RBAC 143 suites / 761 tests and Website Builder 5 suites / 16 tests
pass. Six navigation cases render the real Next Link and verify that it prevents
document navigation and calls the router with the localized destination. The
creation regression covers direct query entry, chooser/form transitions,
unrelated query parameters and back/forward state. Host TypeScript passes.
Browser checks cover the photographic form, Back to projects, Help, home and
the header New project destination. No project, AI or support form is submitted.
The browser reports a Next smooth-scroll advisory; no RSC or hydration error
appears in the checked transitions.

The separate OpenRouter log investigation confirms successful saved provider
responses and matching configured, running-process and dashboard API-key
fingerprints. The relevant UTC interval is included in the refreshed Logs
range; workspace Logs show older requests while the recent replies remain
absent. The cause of this dashboard discrepancy is unconfirmed. No provider
settings or credentials change, and no new inference request is sent.

## Attachment preview follow-up

Saved Knowledge files, message attachments and staged composer attachments open
in the same centered dialog. Images support zoom. PDF.js renders one PDF page
at a time with page and zoom controls; the app bundles its worker and loads it when a PDF
opens. Markdown has formatted and source views; TXT, CSV, JSON, LOG and YAML use
scrolling plain text. Other formats and failed previews retain original/download
actions. PDF and text thumbnails use dark Lucide glyphs and format labels on
the muted background. Remove and reorder controls remain separate buttons.

The shared UI adapter imports no business module. The File Storage attachment
variant retains its shared record reader and explicit display props. Its lazy
local client reader requests stored text through fileApi.previewText only when
the dialog opens, using the shared Query client and File realtime topics.
Declared and streamed text sizes are bounded to 2 MiB, with a 60-second stale
time and 120-second collection time after unmount. Original-byte downloads and
PDF reads use the File Storage SDK with optional cancellation and omitted
credentials. Local files are read in the browser without an upload or message
mutation. Object URLs, FileReaders, render tasks and document loads clean up
when their owner unmounts. Legacy SVG remains blocked.

The browser verifies saved image opening and zoom, local Markdown formatted
and source views, JSON text, a 15-page PDF rendered in the dialog, and Markdown
download. The browser's native PDF object displayed an empty area, so the final
implementation uses PDF.js. No file or message is submitted during these
checks; the user's original draft tab stays untouched. Local screenshot:
/private/tmp/sps-file-preview-markdown.png.

Verification: RBAC 143 suites / 762 tests, File Storage 5 suites / 18 tests,
and Social 25 suites / 72 tests pass. Host TypeScript passes; the module-order
gate checks 14,780 source files with zero violations. Regression coverage
includes lazy text reads, scoped metadata reuse without a Provider, PDF page
and zoom controls, recovery after a failed PDF page, bounded streams,
cancellation forwarding, safe Markdown, focus restoration, object-URL cleanup,
and unchanged unsent drafts/removal/reordering. The first broad RBAC run exits
139 without an assertion failure; its isolated rerun with a 6 GiB Node heap
passes in 18.7 seconds. Logs are under /private/tmp/sps-file-preview-\*.

The Webpack production build passes with the lazy PDF.js worker. Output uses
an isolated .next-file-preview-check directory, preserving the running dev
build. Next's temporary tsconfig include is restored to the exact pre-build
file. The sandboxed sitemap fetch reports EPERM against the local API; this
check confirms compilation, types and worker bundling, with sitemap data
completeness unverified. No PDF worker or Host type error is reported.
