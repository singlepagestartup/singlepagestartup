---
date: 2026-10-23
issue_number: 376
repository: singlepagestartup
status: reviewed
source_head: 55af94890b75fbf691192a88c769ddbf73a7a393
---

# Platform follow-up research

The following reports describe the saved local graph and current source at the stated HEAD. Public author URLs use Profile UUID, never saved `subject-…` slugs. This final contract supersedes the initial slug proposal in the frontend report. Source and CMS behavior remain unchanged at this research gate. Commercial values require the pending operator reply before their data cutover.

# Issue 376 round 2: account, authorship and public authors

Scope: read-only backend research and an implementation proposal. No source,
CMS data, Git or workflow state was changed. The canonical module, frontend,
placement and cache contracts and the owning module/entity READMEs were read.

## Existing registration and personal Profile behavior

The registration requirement is already implemented for email/password, EVM
and OAuth exchange. The missing work is consistent integration and a safe
authoring operation, rather than a second personal Profile creator.

| Flow                  | Current behavior and source                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email registration    | The HTTP handler reads a verified visitor JWT and forwards its Subject ID: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/email-and-password/registration/index.ts:28–40`. The service reuses a default visitor Subject only when it has no Identity, creates the Identity link and registration Roles: `service/singlepage/authentication/email-and-password/index.ts:65–175`.                                            |
| Email sign-in and EVM | Public Subject methods wrap their authentication result in `completeUserAuthentication`: `service/singlepage/index.ts:402–418`.                                                                                                                                                                                                                                                                                                                                            |
| OAuth                 | Callback resolves the existing provider/email/source/new Subject and attaches its Identity: `service/singlepage/authentication/oauth/callback.ts:171–244`; it creates a one-use exchange action at `:256–286`. OAuth exchange passes through the common completion method: `service/singlepage/index.ts:430–435`.                                                                                                                                                          |
| Common completion     | It verifies the issued JWT, calls `socialModuleProfileOwnershipEnsure`, then free-subscription provisioning before returning credentials: `service/singlepage/index.ts:446–459`.                                                                                                                                                                                                                                                                                           |
| Telegram              | It has a separate transport bootstrap. Identity provider/account and its unique Subject link are checked at `service/singlepage/telegram/bootstrap.ts:901–979`. It finds or creates a `variant="telegram"` Profile and default Subject→Profile link at `:981–1057`. Subject creation/Identity-link conflict cleanup is at `:814–850`. The Subject wrapper calls only this transport bootstrap, not common Profile ownership ensure: `service/singlepage/index.ts:610–623`. |
| Guest state           | `authenticationMe` returns `authenticated: !!Subject→Identity links`; a visitor JWT alone is insufficient: `service/singlepage/authentication/me.ts:16–26`.                                                                                                                                                                                                                                                                                                                |

Paths in this table beginning `service/` are relative to
`libs/modules/rbac/models/subject/backend/app/api/src/lib/`.

The existing `social-module/profile/ownership.ts` service:

- Rejects missing Subjects, agent/anonymous variants and Subjects without an
  Identity (`:39–55`). The Identity check is necessary because visitor Subjects
  also use `variant="default"`.
- Separates AI assistant ownership from the personal default link (`:137–185`).
- Creates a personal Profile once and preserves existing names (`:186–205`).
- Rejects a Profile already owned by another Subject (`:206–225`).
- Ensures the Subject→Profile link and private concrete owner permissions
  (`:227–324`). It invalidates route/Subject Role caches before returning.

Idempotency currently uses find/create/re-read after a conflict (`:12–36`),
the Profile's unique slug, and the Subject→Profile relation's unique
`(subjectId, socialModuleProfileId)` key
(`libs/modules/rbac/relations/subjects-to-social-module-profiles/backend/repository/database/src/lib/constraints/singlepage.ts:8–15`).
There is no database constraint limiting a Subject to one personal Profile.
The operation detects multiple personal links and fails, rather than choosing
one arbitrarily.

Two gaps matter for this follow-up:

1. Personal creation uses the public Profile SDK over loopback HTTP at
   `ownership.ts:188–195`. It cannot join a caller's database transaction.
   Subject's Social DI currently exposes Profile reads only (`di.ts:58–60`)
   and constructs a generic CRUD reader in `bootstrap.ts:209–214`.
2. The existing Telegram Profile is non-AI and has a default ownership link,
   so it is selected as personal at `ownership.ts:173–181`, then rejected by
   the strict `profile.variant !== "default"` check at `:220–225`. Account
   repair must accept the supported human transport variant or migrate it
   explicitly while preserving its ID and relations. It must not create a
   second identity Profile.

## Existing scoped operations and author graph

The owned Profile collection is
`GET /api/rbac/subjects/:id/social-module/profiles`. Its handler repairs
ownership before a consistent read
(`controller/singlepage/social-module/profile/find.ts:15–22`). The collection
service bounds Profiles by exact Subject→Profile IDs and postfilters the
result (`service/singlepage/social-module/profile/collection.ts:124–182`).

The matching POST creates AI assistants. It rejects a default Profile because
authentication provisions the personal one (`collection.ts:27–49`). Do not use
this operation for an author Profile. Existing SDK names are
`socialModuleProfileFind`, `socialModuleProfileCreate`,
`socialModuleProfileFindByIdUpdate` and `socialModuleProfileProjects`
(`sdk/server/src/lib/singlepage/index.ts:767–774`, mirrored in client).

The route owner middleware accepts an operator secret unless
`requireJwt:true`; it checks JWT Subject equality when required, but does not
check registration (`backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:11–48`).
A new user-authoring route needs matching JWT **and** the current Identity
check, even when an operator header accompanies the request. The existing
profile ownership middleware reads relation/Profile via operator SDK and also
permits secret-based ownership delegation; it is not sufficient by itself for
the new authenticated-only write.

Social already owns authorship:

- `social/profiles-to-blog-module-articles` has `profileId` and
  `blogModuleArticleId` foreign keys with cascading relation deletion. It
  permits multiple authors and has no single-author or pair uniqueness rule:
  `libs/modules/social/relations/profiles-to-blog-module-articles/backend/repository/database/src/lib/schema.ts:10–25`.
- Its Service is ordinary CRUD, with no owner enforcement or atomic Article
  command: `.../backend/app/api/src/lib/service/singlepage/index.ts:1–7`.
- `rbac/subjects-to-blog-module-articles` already provides the separate
  Subject ownership association:
  `libs/modules/rbac/relations/subjects-to-blog-module-articles/backend/repository/database/src/lib/schema.ts:10–25`.
- Blog Article has localized title/subtitle/description, unique slug and
  presentation metadata. It has no author column, publication status or draft
  state: `libs/modules/blog/models/article/backend/repository/database/src/lib/fields/singlepage.ts:4–30`.

Only the private Article content operation exists in Subject's Blog SDK.
There is no scoped create/update Article command. Granting generic Article or
Social author-relation POST access to every user would let callers choose
authorship or omit ownership and is unnecessary.

The dependency order is RBAC → Social → Blog → Ecommerce. Social owns
Profile→Article composition, while Blog must not import Social. This is
explicit in `.agents/contracts/engineering/module-dependencies.md:1–37`.
Subject is the appropriate authenticated orchestration owner; lower Services
must perform their own writes.

## Public authors and projects

Public authors need a purpose-built Social projection. They must not use
Subject/Identity collection reads or the private project aggregate.

`service/singlepage/social-module/profile/projects.ts:15–134` resolves owned
AI assistants, the requesting personal Profile, private Chat membership,
Chat and document Threads. It returns `profile`, `chat`, `thread` and
`requesterProfileId`. These are private AI workspace projects and cannot
appear on an author's public page.

The existing public portfolio relation is
`social/profiles-to-ecommerce-module-products`, documented in its owning
README. Profile→Blog Article and Profile→Product links explicitly associate
public content with a Profile. The existing operator editorial Profile has
articles without an RBAC owner, according to root's local inventory. Public
directory membership therefore must not require an RBAC Subject or Identity.

The minimal boundary is entirely Social-owned:

- Include supported human/editorial Profile variants only; exclude
  `artificial-intelligence` project Profiles.
- Require an explicit Profile→Article or Profile→Product association for
  directory membership. A new account can have a personal Profile before it
  has published anything, without publishing all account Profiles in a list.
- Return an allowlist: Profile ID, localized title,
  subtitle/bio, public avatar, ordered public Article and Product references.
- Exclude Subject/Identity IDs, emails, sessions, adminTitle,
  `allowedMcpServerIds`, private Chats/Threads/Knowledge and arbitrary Profile
  widgets. Profile fields include the internal MCP configuration, so returning
  the full generic Profile is insufficient
  (`social/models/profile/backend/repository/database/src/lib/fields/singlepage.ts:28–41`).
- Article references expose their public metadata/card content only. Private
  Website Builder trees continue through the existing granted-content gate.
  The current Article model has no draft/publication flag; do not invent one
  in the reader. In this scope, explicit linked Articles are the public articles.

An RBAC registration callback in Social is unnecessary for these criteria.
Social can compose its own associations and lower Blog/Ecommerce/File
Services. Existing `articles-default` already demonstrates Profile-scoped
Article composition through the relation SDK
(`social/models/profile/frontend/component/src/lib/singlepage/articles-default/Component.tsx:18–43`).
The frontend author directory must consume the allowlisted operation rather
than reopen generic private Profile reads.

## Public Profile handle

Public author URLs use `/authors/[social.profiles.id]`. The public DTO omits
the stored slug entirely. The current personal Profile slug is
`subject-${subjectId}` (`ownership.ts:197–203`), so neither a public link nor a
public DTO may expose it. Profile UUIDs identify the public author without
disclosing the separate Subject UUID.

No slug migration, compare-and-swap backfill or new legacy author URL is needed.
Existing Profile IDs, stored slugs and relation IDs remain stable. Personal
ensure still needs an owning Subject lock and relation-based resolution to
preserve its existing idempotency and supported Telegram Profile.

## Proposed typed operations

These are plan proposals, not implemented endpoints.

### Authenticated Article creation

`POST /api/rbac/subjects/:id/blog-module/articles`

Subject SDK: `blogModuleArticleCreate({ id, data, options? })`.
Allowlisted `data`: a request UUID plus localized title, subtitle and
description. The server sets the Article slug/presentation defaults and
resolves the current personal author. It rejects supplied foreign owner,
Profile, relation IDs and unsupported metadata. Response:
`{ article, author: IAuthorSummary }`, including the Article slug and author
Profile UUID, without stored Profile slug or Subject/Identity data.

The route first requires a matching verified JWT, then checks a real Identity
and a non-agent human Subject. It resolves or repairs the canonical personal
Profile on the server. Article creation, Subject→Article ownership and Social
Profile→Article author assignment share one transaction. The validated request
UUID determines the server-owned unique slug `article-${requestId}`; the
database generates the Article ID. Generic repository insert removes supplied
IDs (`libs/shared/backend/api/src/lib/repository/database/index.ts:204–208`),
so passing request UUID as `data.id` would not persist an idempotency key.
A retry can return only the same owned Article with the same author and
validated normalized payload; a slug collision with another owner returns
conflict without its record details. An edited
payload under the same request UUID also returns conflict; it cannot silently
overwrite the completed creation. A new explicit create attempt uses a new
request UUID. The browser never writes the author link separately.

Use an owning Subject repository transaction callback with
`withConsistencyDatabase`, like the existing `withOrderDelivery` pattern
(`subject/backend/app/api/src/lib/repository.ts:12–27`). Do not reuse its
payment-specific lock name. Delegate Article and relation mutations to their
effective owning Services; no foreign table SQL or HTTP loopback inside the
transaction. The existing Subject Social DI needs the effective Profile
create capability and Profile→Article service; add a typed Blog dependency and
the existing Subject→Article service to the facade as needed.

The public Article schema currently stores published content directly; a
draft/moderation lifecycle is separate scope. Owned update/delete authoring
would need the same exact Subject→Article proof, but is not required merely to
provide Create Article.

### Public author reads

Social Profile SDK: `authorFind({ params?, options? })` and
`authorFindById({ id, options? })`, with endpoints
`GET /api/social/profiles/authors` and
`GET /api/social/profiles/authors/:id`. Register these before generic `/:uuid`.
`authorFind` accepts only explicit optional `profileId`,
`blogModuleArticleId`, `ecommerceModuleProductId`, `limit` and `offset`
parameters, not arbitrary Profile
filters. It returns `IAuthorSummary[]`; the detail result adds public Article
and Product references. The Article-ID parameter lets the association's
byline reader load author summaries and public avatars through one safe
operation instead of querying generic Profiles and avatar associations.
Existing `author-default/Component.tsx:18–47` queries full Profile records;
it must move to the DTO reader. `byline/Component.tsx:35–76` also performs an
avatar association query, so the public presentation needs its supplied avatar
slot/field rather than another private graph read. These files live under
`libs/modules/social/relations/profiles-to-blog-module-articles/frontend/component/src/lib/singlepage/`
and `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/`
respectively.

The service applies public eligibility before count/pagination. Unknown,
AI/private and unknown Profile IDs produce no public author result. The
typed DTO is the explicit allowlist above; it is not `IProfile` plus extra
private fields. Host can compose `/authors` and `/authors/[social.profiles.id]`
using the named URL reader and this SDK.

## Cache and permissions

Public author reads can participate in the existing repository read capture,
snapshot and response cache. Their dependencies include Profile, author and
portfolio associations, avatar File, Blog Article and Product data actually
read, including empty associations/count candidates. They never personalize
the result using an account cookie.

The scoped authoring route uses JWT ownership before the handler, no-store
request/response handling and the existing authenticated SDK mutation helpers.
Its client operation patches or invalidates relevant Article/author queries,
retains realtime topics and does not place private account data in the debug
event log. The current client cache contract is in
`libs/shared/frontend/client/api/README.md:1–88`; direct Service aggregates and
transactions are documented in `libs/shared/backend/api/README.md:21–51`.

Provision the exact private authoring permission on the personal owner Role
through the existing ensure flow. Provision only the exact public author read
permissions through the supported operator SDK flow. Keep generic Subject,
Identity, author-relation mutation and private AI project routes unchanged.

## Implementation ownership and checks

Backend account/authoring owner: Subject ownership ensure, completion/Telegram
integration, authenticated route middleware, public facade/DI, transaction,
scoped Article command and Subject SDK. Lower Social owner: public-author
projection and its owning services/DTOs/SDK.
Frontend owner: current account reader/menu, authenticated Create Article form,
public author directory/page and Host URLs. Root owns the explicit local
operator permission rollout.

Existing relevant tests include:

- `subject/.../service/singlepage/social-module/profile/ownership.spec.ts:91–227`:
  repeated and concurrent ensure, guest rejection, foreign Profile rejection,
  preservation and ambiguous personal links.
- `authentication/email-and-password/index.spec.ts`, OAuth callback/exchange
  tests and `telegram/bootstrap.spec.ts` cover their current transport flows.
- `social/relations/profiles-to-blog-module-articles` has a dedicated database
  integration suite described by its README, using a disposable database.

Required new evidence:

- Email, OAuth exchange and Telegram each produce/retain one personal Profile;
  concurrent ensure preserves its ID and existing links.
- Anonymous/missing/expired JWT, guest JWT, agent Subject, foreign Subject and
  supplied foreign author IDs cannot create Articles. Registered owner succeeds
  without a special paid subscription.
- An injected failure at Article, ownership-link or author-link creation rolls
  back all three; request retries do not duplicate authorship or adopt a foreign
  record. Test this with the real database transaction, not only mocks.
- Public directory includes an operator editorial author with no RBAC owner,
  excludes AI/private Profiles and profiles without public links, applies scope
  before pagination/count, and contains no Subject UUID even in slug strings.
- Author pages retain public Article/Product links and omit private Chat,
  Thread, Identity, email and MCP fields. Private Article widget protection
  remains covered by the existing full guard/cache/bytes integration matrix.
- Warm public caches reconcile after author/profile/avatar/Article/Product
  changes; scoped mutation caches do not leak across principals. Built Host
  author pages and account controls respect public versus request/session
  rendering and do not use the private AI project endpoint.

The public eligibility rule above avoids a new upward dependency or a second
registration model. The public handle is the Profile UUID; the stored slug is
private.

## Raw Profile privacy addendum

Local read-only SDK policy resolution and anonymous HTTP reproduce the existing
exposure. Evidence: `/tmp/sps-376-round2-raw-profile-audit.json`; its companion
script contains no credentials. No private field values were printed in the
audit output.

| Generic GET shape                           | Permission ID                          | Current result                                                                                                                        |
| ------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/social/profiles`                      | `dcff63a9-8778-44de-90cf-403e6b21cc0b` | Roleless, anonymous 200; 63 full rows, including 27 AI Profiles and 26 Subject-derived slugs.                                         |
| `/api/social/profiles/count`                | `e5edcdf0-3feb-462d-9a06-c17cf4ebb30b` | Roleless, anonymous 200; count 63.                                                                                                    |
| `/api/social/profiles/[social.profiles.id]` | `d93bb382-c983-4c0d-ad7c-196fe6de00c5` | Roleless, anonymous 200 for an actual AI project Profile; includes title, biography, adminTitle, allowedMcpServerIds and stored slug. |

Social is not in the global static public-module allowlist
(`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:64–84`). These
three saved roleless permissions make the reads public through the existing
Role resolver. The sensitive-route subtraction currently has only RBAC
Identity/Subject/Role families, not Social Profiles
(`libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/sensitive-routes.ts:22–43`).
The existing protected Blog middleware passes raw Social GET requests through
because they are unrelated resources. A new public-author DTO alone cannot
close this exposure.

### Consumer migration before restriction

Public consumers must use the author projection:

- Article authors:
  `social/relations/profiles-to-blog-module-articles/frontend/component/src/lib/singlepage/author-default/Component.tsx:18–47`
  queries full Profile rows; Social Profile `byline/Component.tsx:35–76`
  separately reads its avatar associations. Replace both reads with
  `authorFind({params:{blogModuleArticleId}})` and the supplied avatar.
- Product seller:
  `rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/card-default/Profile.tsx:9–77`
  queries the Product association, then full Profiles, and emits
  `/social/profiles/${profile.slug}`. Replace it with
  `authorFind({params:{ecommerceModuleProductId}})` and `/authors/${profile.id}`.
- Legacy Social profile page:
  `social/models/widget/frontend/component/src/lib/singlepage/profile/overview/default/Content.tsx:4–33`
  reads full Profiles by stored slug. The new public composition uses the UUID
  author projection. Do not retain this slug-based generic reader as a public
  bypass after retiring the raw policies.

Normal account and operator reads have separate boundaries:

- Current account collection/settings and avatar operations already use
  Subject-scoped APIs; the collection is bounded by exact ownership.
  Backend loopback SDK calls carry the operator key. They continue under the
  raw read restriction.
- Admin Profile forms/tables require an explicit administrative Role or the
  operator key. Anonymous/public admin rendering is not preserved.
- Private Chat row loaders need migration; they must not use public-author
  eligibility or another user's own-Profile collection.

### Existing Chat scope and the remaining fallback

`controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/index.ts:41–124`
proves Subject→requester Profile ownership and Profile→Chat membership before
returning the Chat. With `includeParticipants=true`, `:136–142` expands
participants. The owning participant service bounds relation reads by the
exact Chat and Profile IDs
(`service/singlepage/social-module/chat/participants.ts:28–73`).

The Chat overview client already requests this expansion
(`frontend/.../social-module/profile/chat/overview/default/client.tsx:10–17`),
uses `socialModuleChat.participants` in its view at `ClientComponent.tsx:427`,
and passes that Chat into the message timeline at `:1738–1749`.
This authorized participant map is suitable for normal Chat member rows.

The remaining raw fallback readers are
`message/list/default/components/MessageProfileLoader.tsx:16–68` and
`ActionProfileLoader.tsx:17–70`: each reads its sender/actor association, then
generic full Profiles. Social `chat-profile-avatar/ClientComponent.tsx:85–153`
can use a supplied File; otherwise it reads avatar associations.

To preserve historical senders who have left the Chat and preserve avatars,
enrich the existing scoped Message/Action results with an optional typed
sender/actor presentation and avatar. Resolve only the sender of a Message or
actor of an Action already proven to belong to the accessible Chat. Return
allowlisted display fields through a lower Social presentation DTO; RBAC owns
the Chat access check and supplies the JSX/data to the Social view. Retain the
authorized participant map for current members. No public Author query or
generic authenticated Profile grant can replace this resource scope.

### Minimum guard and policy disposition

Add an owning RBAC middleware for only the raw Profile GET/HEAD collection,
count and UUID detail shapes. It allows the operator or a caller with a fresh,
explicitly Role-bound administrative permission, including the existing root
permission semantics. It must not interpret the current roleless saved rows
as a grant. Missing/invalid credentials, guest sessions and ordinary unrelated
registered users are denied. Normal owners continue through their existing
Subject-scoped APIs.

Install this guard in `apps/api/app.ts` after global authorization/query
parsing and before both response caches (`:514–532`). Exclude these exact raw
read shapes from both caches; do not match `/profiles/authors` or its UUID
author detail path. Canonicalize UUID aliases and protect implicit HEAD reads.
Role and ownership changes must be checked before serving a warm response.
Keep the owning middleware in RBAC's middleware package and compose effective
Services in the API app; Social must not import RBAC.

After consumer migration and guard verification, bind the three existing raw
Profile GET permission rows above to the intended administrative Role through
the supported operator SDK flow. Keep their IDs stable and record the exact
Role binding as rollout evidence. Do not remove protection by setting a new
global public permission or opening Subject collections.

The read-only association inventory also found these roleless GET policies:

- Profile→File list `53cd6517-d686-4f1e-b2f6-d185e13c9d4b` and count
  `ce3b265f-3fee-44cd-851a-98fe61bf3b93`: both anonymous 200; relation detail
  has no permission and returns 403.
- Profile→Article list `6f6bc78c-f1ed-4291-9355-a64996bc73ff`: anonymous 200;
  count/detail have no permission and return 403.
- Profile→Product list `1d600996-081f-4d93-bdb9-f133c4728541` and count
  `059700b3-f8bb-415e-bc10-fa60ea8d8fec`: anonymous 200; local count is zero.

These relation payloads contain Profile/File/Article/Product UUIDs and
association presentation metadata, not the private biography, MCP settings or
Subject-derived slug. This audit does not establish a separate sensitive-body
exposure through them. Preserve these existing GET policies in this bounded
follow-up; public DTO consumers no longer need their raw fallback reads. The
private Blog graph isolation guard already rejects protected Files/Widgets
being reused in public Profile associations, both before private marking and
on subsequent attachment. Public avatar DTO fields should be only File ID,
path/URL, MIME type, extension, alt, width and height; no internal File admin
fields are needed.

### Acceptance evidence and documentation correction

- Warm each raw Profile shape with operator/admin credentials; then anonymous,
  guest and ordinary foreign-user calls must deny before both cache modes.
  Admin revocation denies the next read. Public author DTOs remain available
  and contain no slug, Subject UUID, MCP configuration or private AI Profile.
- A normal owner's scoped collection/avatar still succeed; a foreign Subject
  fails. Existing operator/MCP CRUD and explicit admin-role readers still work.
- An ordinary Chat member sees another member and a historical sender through
  the Chat-scoped display data, including avatars; an outsider cannot obtain
  that Chat's display data. Exercise raw Profile endpoints too, proving the
  Chat presentation does not depend on reopening them.
- Public Article bylines, Product seller links, author directory/detail and
  the legacy public Profile composition must make no generic Profile query.
- Subject README `:275–277` is stale: it says the collection includes shared
  Chat Profiles and POST accepts default. Update it to exact ownership and
  AI-only POST semantics, matching `collection.ts:27–49,124–182` and the later
  accurate README section. Treat source behavior as authoritative.

No existing shared bounded TipTap command validator was found in the targeted
shared/RBAC source search. A narrow new command schema belongs beside the
Subject SDK/model command schemas. It must bound localized titles and rich
text, allow supported TipTap nodes/marks and safe links, reject arbitrary HTML
and unsupported metadata, and enforce total size/depth/node limits. Trusted
admin strings are not a validation contract for authenticated public authoring.

# #376: account menu, authors and owned article creation

Status: read-only frontend research and proposed implementation contract. Source, CMS data, Git and workflow status are unchanged by this research. Backend API names and new route names below remain proposals for the shared plan.

## Current runtime

The default Website Builder navbar already receives domain content through a Host leaf. That leaf currently mounts only `me-ecommerce-module-cart-default`. Add account controls beside the cart in this Host composition; Website Builder keeps its saved logo, navigation, presentation and mobile layout.

Source: [navbar Host leaf](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/widget/singlepage/navbar-default/Component.tsx:1), [Website Builder Host bridge](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component.tsx:1).

`authentication-me-default` supplies the authoritative `authenticated` boolean. A guest JWT can identify a real Subject while `authenticated` is false. The reader checks the returned Subject against the token identity, handles cookie changes and JWT expiry, and has explicit fallback/skeleton/error behavior. Use this reader with `isServer={false}` for the navbar and article form on cached Host pages. Cookie presence, decoded Subject ID and an inherited token's claim shape cannot establish signed-in status. A valid inherited session continues through the server's current authentication result; registration/authentication migrations must preserve it.

Source: [authentication client reader](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/client.tsx:77), [children interface](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/interface.ts:7).

The legacy `me-authentication-default` ignores that boolean and performs its own Subject→Identity relation lookup. Its missing-Subject branch renders nothing. It should not be the new navbar entry point. The AI Chat controls already use the authenticated boolean and pass the loaded Subject into children. Its account reader additionally loads billing balance on every mount; the general navbar does not need that read.

Source: [legacy action](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/authentication/default/ClientAction.tsx:1), [AI Chat controls](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/navigation/controls-ai-chat/ClientComponent.tsx:1), [AI Chat account reader](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/account-ai-chat/client.tsx:1).

The scoped profile settings flow already reads owned personal Profiles and updates the chosen Profile through Subject SDK methods. It supports title, plain subtitle, description and slug. Keep own-account reads in RBAC and public author reads in Social. The existing `socialModuleProfileProjects` endpoint contains private AI Chat project data and cannot supply a public portfolio.

Source: [owned profile settings](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/social-module/profile/id/update-ai-chat/ClientComponent.tsx:1), [scoped Profile update SDK](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/update.ts:1). Private-project semantics and existing authentication provisioner are attributed to the parallel backend research.

## Studio coverage

| Surface                         | Existing reference                                                                                 | Required work                                                                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guest Sign in / current account | RBAC Subject `me-account`; Social Profile `account-menu`                                           | Preserve trigger sizing, icon, avatar and dropdown. Add actual menu entries for My author page, Create article, Chats, settings and Sign out. Remove fixture/session dependencies from runtime. |
| Author detail                   | Social Profile `author-find-by-id-overview-default`; Host Page `social-module-profile-slug-author` | Use actual title, plain subtitle, public description, articles and linked public products. Hide fixture-only biographies, skills, statistics and social links when absent.                      |
| Author directory                | Social Profile `card`, `find-row`, `compact`                                                       | Add a directory Widget/Page recipe and loading/empty states in Studio before runtime. No existing Authors directory Host recipe was found.                                                      |
| Owned article form              | Blog Article `admin-v2-list` editor; runtime `admin-v2/form`                                       | Add a public, authenticated create recipe in Studio. The existing generic admin editor exposes variant/admin fields and author relations and uses generic Blog mutations.                       |

References: [Studio account](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/rbac/subject/singlepage/me/account/Component.tsx:1), [Studio menu](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/social/profile/singlepage/account-menu/Component.tsx:1), [author overview](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/social/profile/singlepage/author-find-by-id-overview-default/Component.tsx:1), [author Page](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/host/page/singlepage/social-module-profile-slug-author/Component.tsx:1), [Profile card](/Users/rogwild/code/singlepagestartup/sps-lite/apps/studio/modules/social/profile/singlepage/card/Component.tsx:1), [Article admin form](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/blog/models/article/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:25).

Studio's Social account menu imports an RBAC fixture. That Studio dependency must not enter runtime Social. A runtime Social menu accepts explicit Profile presentation props and rendered menu entries; RBAC owns email, session, logout and business destinations. Runtime views do not import Studio components or use fixture names, balances, avatars or statistics.

## Proposed ownership and registration

| Owner          | Proposed variant / responsibility                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RBAC Subject   | General account controls: one `authentication-me-default` boundary, visible Sign in for guest/missing session, account for authenticated Subject. Prefer Studio-aligned `me-account` presentation with a general navigation controller; final literal names belong in the plan. |
| RBAC Subject   | `me-blog-module-article-create-default`: current-Subject gate, typed create SDK mutation, validation/draft/requestId lifecycle and result navigation. No arbitrary author selector.                                                                                             |
| RBAC Widget    | `subject-me-blog-module-article-create`: exact saved functional Widget instance; connects its approved Website Builder presentation through a default relation/rendered form slot.                                                                                              |
| Social Profile | Typed public author card/byline/overview presentation. Port exact Studio `card` and `author-find-by-id-overview-default` references where applicable. Use a public author DTO as the reader/view type, without asserting it is the complete private Profile model.              |
| Social Widget  | `author-list-default` and `author-overview-default`: public projection queries, pagination/loading/empty/not-found handling, public Article/Product composition.                                                                                                                |
| Host           | Existing navbar leaf adds RBAC account node beside cart. Social leaf resolves saved author slug once through `Page url-segment-values`. Saved Page/Layout/Widget relations select the directory, author detail and create page.                                                 |

Read current frontend/module contracts and neighboring files before each new variant. Register both the layer variant map and props union. Specialized client/server readers retain the required `interface`, reader, view, entry and single-entity `Skeleton` roles. Collection skeletons belong to the owning Widget. Existing shared SDK Provider/QueryClient remains the sole data cache owner.

A lower Blog card receives a rendered author `ReactNode`; it never imports Social or RBAC. Social can compose Blog and Ecommerce entities because both are lower modules. If Product checkout controls need an RBAC action, Host/RBAC composes that rendered slot. Website Builder does not choose account, author, article or checkout behavior. Existing private Article content gates remain in place on article pages.

## API contract required by the frontend

Parallel backend proposal:

- Subject `blogModuleArticleCreate({ id, data: { requestId, title, subtitle?, description? } })`, POST `/api/rbac/subjects/:id/blog-module/articles`. Matching Subject and an actual linked Identity are required. Guest JWT is denied. The server resolves/ensures the personal Profile and atomically creates Article, Subject→Article ownership and Social Profile→Article authorship. Caller-controlled Subject/Profile/author-relation/variant fields are rejected. Result `{ article, author: IAuthorSummary }` gives saved Article and safe author slugs.
- Same owner, requestId and payload return the same result. Edited payload with the same requestId returns 409. A foreign requestId collision returns 409 without record details. The form preserves the current requestId during retry and starts a new one only for a new logical attempt; it must not silently change an uncertain operation's identity.
- Social `authorFind({ params: { blogModuleArticleId?, profileId?, limit?, offset? } })` returns allowlisted `IAuthorSummary[]` with public id, saved safe slug, title, plain subtitle and approved avatar. `authorFindBySlug({ slug })` adds public Article/Product references and public description. Querying by article lets the author slot replace raw Profile/Avatar collection reads.
- Directory eligibility is an approved public/human Profile with explicit public Article/Product links. An operator's editorial Profile can qualify without RBAC ownership. Empty registered accounts need not appear. AI/project profiles, private configuration, Subject IDs and Chat/Thread data are excluded.
- Every public author URL uses a saved safe slug. Existing personal slugs contain `subject-${SubjectUUID}`; backend safe-slug migration/backfill is required before rollout. The UI must not construct a URL from a Subject ID or publish a legacy Subject-derived slug.

These APIs need the shared cache identity, mutation patch helpers and realtime topics for author/article/product relations. The API owns allowlisting and eligibility. Frontend filtering is display behavior, not the privacy boundary. Cache keys include host, principal and semantic request input as required by the shared SDK contract. Logout/session expiry removes private account/form UI; public author results remain public.

## Routes and saved instances

Proposed paths, subject to the shared plan's final names:

- `/{language}/authors`: public Social author directory.
- `/{language}/authors/{savedSafeProfileSlug}`: public author overview, saved Page mask `/authors/[social.profiles.slug]`.
- `/{language}/blog/new`: authenticated article form. This path avoids the existing `/blog/articles/[blog.articles.slug]` segment shape; the actual saved Page inventory still needs final collision verification.
- Chats menu: `/{language}/ai-chat/projects`, an existing operational page. There is no saved `/ai-chat` Page in the current shell inventory.
- Sign in: existing `/rbac/subject/authentication/select-method` Page, localized through current Host conventions. The existing general login redirects to configured success `/`; it does not implement `returnTo`. A return-to-create feature requires an explicit bounded internal-path contract and tests; the first implementation can retain normal login success and expose Create article on the resulting navbar.
- Settings: existing `/{language}/ai-chat/settings` works for current owned Profile editing. A general settings URL requires an explicit saved Page/Widget graph; it must not be invented by the account menu.

Host `findByUrl` enumerates generated Page URLs and takes the first match; it has no explicit literal-before-dynamic precedence. `/blog/articles/new` would require a reserved Article slug or routing-priority rule. Source: [Page route service](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:23).

The existing Social Host bridge already reads the complete URL-value map inside the Page callback and passes only `profileSlug`. Extend its explicit author composition rather than threading route maps through Widgets/relations. Source: [Social Host bridge](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/Component.tsx:1).

CMS changes belong to the exact current navbar graph: replace Subjects button `f569c1bb-cc8f-4e00-b787-89546c090e47` in Array `82b04a12…` (relation `5bfbf853…`) with Authors; remove public Chats navigation relations while keeping the account entry and operational pages. Root owns that SDK data flow and confirms the complete IDs before writes. New pages use normal saved Page/Layout/Host Widget/external domain Widget links, not hardcoded page selection in relation components.

## Acceptance and verification

1. Studio recipes cover guest/signed-in account, Authors grid/empty/loading, public author with and without products, and authenticated article draft/pending/error/success. Existing navbar/card design remains the reference.
2. Account renders Sign in for no cookie and guest JWT. An inherited valid authenticated JWT renders the real current Profile. Expiry, account switch and logout close the menu/private form and cannot reuse a different Subject's data. Dropdown supports keyboard opening, focus, Escape and correct mobile trigger labels.
3. Create Article issues one owning command, never generic Blog create plus frontend relation writes. Pending state prevents duplicate submit; errors retain draft and retry identity. Same-request replay yields one persisted Article with both ownership links. Guest/foreign Subject/forged Profile requests fail. Runtime integration tests verify transaction behavior and both links.
4. Authors directory, byline and detail consume public projection results. Public payloads/HTML/URLs contain no Subject UUID/legacy slug, private config or Chat/Thread/project DTO. Existing editorial author remains eligible. New author's first public Article makes the profile reachable through its saved safe slug.
5. Author page shows actual Profile text, actual linked Article cards and actual public Product projects. Missing fields are omitted. Subtitle remains plain text with the existing legacy-rich-text extraction helper. Author links in Article metadata reach the correct profile without breaking the full-card primary link or nesting anchors.
6. One author/card skeleton and one account skeleton match their entity layouts; the directory Widget composes grid placeholders. Completed empty directory and missing author are distinct. A missing author triggers not-found only after a completed read. Failed requests have an explicit retry state.
7. Run focused component/SDK tests, owning frontend typechecks and module-dependency checks. Verify actual Host SSR/RSC and client routes with existing inherited, guest and newly authenticated sessions; confirm no personalized cached HTML, missing slot or client/server serialization failure. Run a production Host build after source freeze, then browser checks for desktop/mobile navigation, authors, creation and preserved closed-content behavior.

No runtime or browser acceptance is claimed by this research. API names, final route collision check, safe-slug backfill scope and the final Studio recipe names must be fixed in the shared plan before implementation GO.

# Issue 376: shell и About, round 2

Исследование read-only. Источники: текущие Studio Product/Website и runtime-код; локальный API прочитан через существующие server SDK без mutations. Снимок точных записей: `/tmp/sps-376-round2-shell-sdk.json`. Изменения исходников, CMS и Git отсутствуют. Нижеследующая композиция — предложение для реализации после GO.

## Источники визуала и содержания

- `apps/studio/workspace/products/singlepage/catalog.yaml` регистрирует продукт `singlepagestartup` отдельно от `ai-chat`.
- `apps/studio/workspace/products/singlepage/singlepagestartup/product.md:116`: Code Framework — повторно используемая основа веб-продукта для человека, который направляет coding agent. Готовые accounts/access, commerce, payment integrations, исходники и документация; бизнес-правила и представление принадлежат конкретному проекту. AI Chat — отдельный hosted product. Числа о количестве модулей/моделей в Product не переносить без отдельного пересчёта.
- `.../singlepagestartup/website/page.md`: точный maker-oriented текст секций hero, foundation, journey, example request/change, AI Chat, FAQ и repository links. Главная мысль: “Build your product on a foundation you can reuse.” Первая CTA открывает `https://github.com/singlepagestartup/singlepagestartup`.
- `.../singlepagestartup/website/Landing.tsx`: hero с тёмной текстовой половиной и фотографией, светлая section с описанием повторно используемых функций, три карточки локального старта, пример бизнес-изменения и отдельная AI Chat section. Это React preview продукта; он не готовый runtime Widget и импортировать его из Studio в production нельзя.
- `.../singlepagestartup/website/content.ts`: asset IDs и parser текста. Визуальные источники: `singlepage-generated-living-focus-primary-lockup`, `singlepage-generated-living-focus-photography-business-conversation-square`, `singlepage-generated-living-focus-illustration-module-hierarchy-cool-square`, `singlepage-generated-living-focus-illustration-coordinated-agents-cool-square`.
- `apps/studio/modules/website-builder/widget/singlepage/navbar-default/Component.tsx`: верхняя строка 80 px, `max-w-7xl`, Onest, белая/card поверхность, компактные navigation links, отдельные cart/account slots.
- `apps/studio/modules/website-builder/widget/singlepage/footer-default/Component.tsx`: бренд + описание и группы ссылок с заголовками, нижняя граница и copyright/legal row. Его demo Careers/Press/Terms/Privacy/Cookies и `href="#"` не являются реальными страницами проекта.

Product и Website имеют `confirmation.confirmed: false`. Текущий запрос разрешает работу над локальным Framework; он не меняет approval metadata этих документов. Для About адаптировать смысл и EN/RU copy, не переносить внутренние ограничения/approval notes в пользовательскую страницу. Preview-фразу “AI Chat is not connected” также не переносить: runtime destination уже существует.

## Точная текущая графовая композиция

Общий public Layout `288ea6c6-10eb-41f6-9f9c-1771e6608a23` применяется к Framework, Blog и About.

| Узел                               | Точный ID / ссылка                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Navbar Layout→Host Widget          | `8f4e4066-ae2f-48d1-92db-06bd24a94f03`, variant default                                     |
| Navbar Host Widget                 | `642e413e-3bda-4c17-b377-41c30f67c611`                                                      |
| Navbar Host external relation      | `31b4040e-cb13-4918-bb58-3c18d9a34436` → website-builder                                    |
| Navbar WB Widget                   | `ca5ee22a-eea8-494d-811c-e00339a4c175`, navbar-default                                      |
| Footer Layout→Host Widget          | `10b3426e-dda9-49b7-abbf-cb7d4b7d8305`, variant additional                                  |
| Footer Host Widget                 | `a3b93880-8708-4fb9-844a-5b2ecb20942a`                                                      |
| Footer Host external relation      | `79e92151-2350-4a87-b795-b28def022656`                                                      |
| Footer WB Widget                   | `5d735c1d-2fcb-4db2-9eda-f7e3e931221b`, footer-default                                      |
| About Page                         | `99ffcce1-adf1-44c0-878a-19902b9151ff`, `/about`                                            |
| About Page→Layout                  | `b7170bac-a11d-4b9a-9420-e348597559a9`                                                      |
| About Page→Host Widget             | `7015795f-30ad-4eaf-a694-33cd1d7ba85f`, order 0                                             |
| Wrong About Host Widget            | `99ea0b61-b514-47e3-a17d-c8f2319241fe`, Blog Article List                                   |
| Wrong About Host external relation | `4da57f85-c7db-429c-a24f-88957615a143` → Blog Widget `a8e1cca9-22f3-4579-a508-ab9ad848440a` |

Blog Widget `a8e1cca9...` также обслуживает список `/blog`. Не менять его variant, записи и фильтры ради About. Для About заменить только связь `7015795f...` на новый статический Host→WB root и добавить другие ordered Page→Widget links. Старые before-values сохранить в root-owned manifest для rollback. About остаётся обычной сохранённой Page; новый Host business dispatcher не нужен.

## Logo

Существующий Navbar→Logotype `bc1001ef-9609-4b23-8ba0-cb9a65dd0f51` указывает на Logotype `536dee30-8213-4f58-9c2c-a6adf4b4dfaa`. У него URL `/`, title `{en:null}`, class `w-24`. Logotype→File `94da75d9-b21b-4425-82a6-a02ee9f63862` указывает на File `0bbaff37-9979-46bc-8261-fa86bb919ac3`, `/file-storage/static/1205d017.svg`, 4725×729, container `aspect-w-4 aspect-h-1`. Это legacy wordmark. У footer вообще нет Widgets→Logotypes relation; отсутствие footer logo объясняется данными.

Точный S mark из Studio default Logotype: `apps/studio/workspace/assets/singlepage/intake/operator-logo-square-white.svg`, 200×200, чёрный S на белом. Registry ID `singlepage-operator-logo-square-white`; парный inverse — `singlepage-operator-logo-square-black`. Studio default `apps/studio/modules/website-builder/logotype/singlepage/default/Component.tsx` показывает 32 px mark + текст SinglePageStartup, скрывая текст ниже 480 px. Не перерисовывать знак и не генерировать новый.

Минимальный runtime путь: root загружает этот существующий SVG через File SDK, retargets точный Logotype→File link и меняет Logotype.url на `/framework`; локаль добавляет имеющийся `saveLanguageContext`. Отдельная footer Widgets→Logotypes relation может ссылаться на тот же Logotype. Исходный File record и его байты сохраняются для rollback. Для текста рядом с S нужно отрисовать сохранённый `Logotype.title` в default presentation: сейчас `libs/modules/website-builder/models/logotype/frontend/component/src/lib/singlepage/default/Component.tsx` игнорирует title и показывает только linked media. Достаточно типографики/размеров в этом варианте, без hardcoded бизнес-навигации и без использования `brand-ai-chat` (у него другой brand/URL).

## Header и footer: membership

| Пункт header              | WB Widget→Array                                    | Array                                  | Button                                 |
| ------------------------- | -------------------------------------------------- | -------------------------------------- | -------------------------------------- |
| About `/about`            | `7e1fd0fd-c28b-431e-8b3f-cfd764d129a6`             | `bf6211ab-b521-4fcb-ac25-eeb6525b9cfb` | `3fe07489-3106-4c8d-93b8-37337c9f9105` |
| Blog `/blog`              | `c7138ef0-a056-405a-a106-190a836d15e4`             | `79b3173f-21f5-4d33-aa5b-5d89bb8e1490` | `e84aa628-9370-498b-952a-2e381a28b3b4` |
| Ecommerce `/ecommerce`    | `dfb515d0-8414-4aa5-a031-dbbb99689670`             | `8997b868-a7de-48b1-abf9-d5ac4c881cc0` | `26f7e03d-1c21-42da-a0f6-be36da6f3d3f` |
| Subjects `/rbac/subjects` | `5330b56e-3b26-4267-9d98-c0d968edd993`             | `82b04a12-9e8e-42d2-bb6e-f403114045c0` | `f569c1bb-cc8f-4e00-b787-89546c090e47` |
| Chats `/social/chats`     | `b6ec9745-8aa8-4bc6-afaf-bfdc939e3a9f`             | `ab0807f2-362e-4339-9f23-1d2dc36e39c4` | `c057c4d8-6f1b-4419-85f9-efb320099d6b` |
| Languages                 | `7ea7ad8c-da9a-4159-9805-fef1312a6ded`, additional | `f73447a2-29db-4d6a-922a-0ffa4b6abe19` | RU `a4fe7e10...`; EN `d71b7834...`     |

Скрыть только Chats membership `b6ec9745...` по существующему варианту hidden, сохранив маршрут, кнопку и данные для account dropdown. Не фильтровать навигацию по title/URL в JSX. Subjects Button `f569c1bb...` и название его Array заменить на Authors / Авторы; proposed canonical URL от `content_frontend` — `/authors`, detail `/authors/[social.profiles.slug]`. Root подтверждает contract вместе с владельцем author directory; не публиковать Subject UUID или Subject DTO через эти страницы.

AI Chat landing — Page `c9d1562a-ff09-4381-a46d-23d67fa62643`, URL `/`. В текущем SDK snapshot нет Page `/ai-chat`. Header и footer AI Chat links должны вести на локализованный `/`, если root не создаёт отдельный alias. Существуют `/ai-chat/projects` и `/ai-chat/sign-in`. Generic sign-in Page `67a7e8d8-5e05-4c25-b578-f0fb62ed6964` имеет URL **`/rbac/subject/authentication/select-method`** (singular), settings — `/rbac/subjects/settings`.

У footer сейчас одна default relation `91ca6b85-a71b-45e9-8074-1a6313b414bf` → Array `1abd6283-ab2d-4bda-95c5-11d1501a2054`, title “Footer Buttons”. В ней только Contacts Button `5ca2b0cc-fbd6-4551-acd8-dbdb95c257eb` → `/contacts` и общий About Button `3fe07489...`. Page `/contacts` отсутствует. Для Contact достаточно действующего `/<locale>/framework#contact`, если root сохраняет contact anchor; голую несуществующую `/contacts` не оставлять.

Предложение footer групп: Framework (Framework, About, Ecommerce); Resources (Blog, Authors, repository documentation); Products (AI Chat); нижняя строка — source license и GitHub Issues, существующие ссылки Product Website. Не копировать Studio demo corporate/legal links без реальных destinations. Число колонок определяется настоящими группами, визуальная сетка/типографика берётся из footer-default Storybook.

Текущий runtime Footer уже различает Widgets→ButtonsArrays variants default/additional/extra. Его group rendering можно сохранить, назначив default колонкам, additional supplementary actions, extra нижним utility/legal links. Но runtime ButtonsArray default не показывает свой title. Минимальное дополнение — owning ButtonsArray `footer-column` variant с localized title и ordered linked buttons; register/interface/SDK variant metadata в том же слое, обычный default relation продолжает выбирать saved variant. Глобально включать заголовок в ButtonsArray default нельзя: header arrays About/Blog тоже имеют title и получат дублирование. Footer Widget description может хранить brand blurb, subtitle — локализованную copyright line; новая schema не нужна.

## About: предлагаемая структура и reusable blocks

1. Hero: заголовок SinglePageStartup Code Framework, короткая product value proposition, фотография business-conversation, CTA к GitHub и локальному `/framework`. Содержание — Product identity/value + Website hero, без claims об ускорении, uptime или support schedule.
2. Foundation: 3–4 карточки Accounts and access / Commerce / Payments / Code and guidance из Product и Website foundation. Отдельная ссылка AI Chat описывает готовый пример продукта на той же основе.
3. Architecture: 6 карточек с конкретными шаблонами и ссылкой на repo docs. Источники для технических фактов — README `Core Architecture`, `.agents/contracts/engineering/frontend-components.md`, `module-dependencies.md`, `libs/shared/frontend/client/api/README.md`; maker Product сам эти детали не доказывает.
4. Local start: Open project → Run locally → Add business logic из Website journey; опциональный setup-request text. Без нового interactive clipboard control, если копирование не входит в выбранный объём.
5. Финальная компактная CTA: посмотреть действующие компоненты `/framework`, читать Blog и перейти к AI Chat `/`. Не дублировать список статей внутри About.

Architecture cards: (a) module owns Models и explicit Relation records; (b) backend App/Controller+middleware → Service → Repository; (c) SDK Providers/shared readers и явный server/client boundary; (d) owning domain Widget отдельно от Website Builder presentation через точные links и JSX slots; (e) principal/resource checks на сервере, включая initialized guests; (f) React Query cache + shared realtime consistency, отдельное no-store/expiry поведение защищённого контента. Это описания проверяемых механизмов, без лозунгов “каждый модуль полностью независим” или придуманных количественных метрик.

Studio-ready visuals: Widget `content-hero`, `content-feature-find-card`, Feature `card`; их production counterparts сейчас отсутствуют. В production есть content-default (dark hero + related files/sliders/features), content-feature-find-row (контактная frame с form slot) и content-ecommerce-default (каталожная frame). Нельзя выбрать Studio variant только в CMS и ожидать, что runtime его отрисует.

Минимальный точный перенос требует новых production variants `Widget/content-hero` (loaded saved copy, ordered CTA groups и linked media), `Widget/content-feature-find-card` (saved heading + ordered Widgets→Features) и `Feature/card` (saved localized feature + optional linked media). Использовать стандартные index/interface/Component/Skeleton roles и public registries; никаких импортов Studio/fixtures в runtime. Header h1 только в hero, section h2, Feature titles h3. Grid/card layout переносится из Storybook, текст/relations — из CMS. Если root ограничит объём одним новым grid variant, hero можно начать с existing content-default, явно приняв отличающуюся компоновку media ниже текста.

Внешняя композиция About: Page → exact ordered PagesToWidgets → dedicated Host Widget per section → default Host external WebsiteBuilder relation → saved WB Widget. Только статическая presentation: новый RBAC Widget для About не нужен. Общий Blog Widget не меняется; Framework hero `4e55875f...` и CRM frame не переиспользуются как изменяемые записи About.

Account input: WB navbar отображает готовый slot. RBAC Subject владеет текущей сессией, guest/auth state, login/account/settings/logout controls; Host navbar leaf соединяет их с cart. `content_frontend` исследует/разрабатывает этот контракт. Не добавлять authentication reads или business routing в WB, не подменять generic account AI Chat project selector. Для account Chats `content_frontend` использует локализованный `/ai-chat/projects`. Существующие sign-in формы не поддерживают предполагаемый returnTo query: они перенаправляют на настроенный success destination; обратный переход к новой author операции потребует явной ограниченной реализации или обычного sign-in → Create flow.

## Порядок и проверка

Root-owned SDK manifest сначала сохраняет точные before-values и общие references, создаёт новые About nodes/footer groups/Files, затем меняет конкретные associations. Unknown create outcome восстанавливается по manifest IDs, повторный apply не создаёт дублей, rollback возвращает старый About link и nav memberships. Backend/data snapshots не изменяются. Новые variants должны существовать и проходить reader-path/registry проверки до назначения saved variant.

Проверить EN/RU и ширины 320/desktop: S mark и brand, logo href `/<locale>/framework`, AI Chat href `/<locale>/`, отсутствие Chats в header/footer, Authors без Subject identifiers, непустой account slot для guest/auth, групповые footer headings и настоящие URLs. About содержит отдельные статические Widget/Feature records и больше не показывает общий Article list. Прямые URL, caches/revalidation, source metadata, existing Blog listing и AI Chat shell остаются рабочими. Новые generated images для shell/About не требуются: используются существующие зарегистрированные masters/deliveries.

# ISSUE-376: catalog and AI Chat token research

Scope: read-only follow-up research and proposed minimum plan. Source commit `55af94890b75fbf691192a88c769ddbf73a7a393`; local SDK inventory read at `2026-10-23T18:25:46.142Z`, with an additional permission/Widget read recorded in that manifest. No source, CMS, Git or status mutation was performed.

Private inventory: `/tmp/sps-376-round2-commerce-inventory.json`, mode 0600. It contains current records, order/invoice associations and potentially sensitive Store attributes; keep it out of Git and public issue attachments. No Store API-key value is reproduced here. Reads used normal server SDKs with explicit `http://localhost:4000`, no-store and the local operator environment. No production MCP was used.

## Current saved catalog

There are four Products, three Categories, six Currencies, fourteen Attributes, four Attribute Keys, one Store and forty-one Orders. There are no `widgets-to-products` records and no standalone token-pack Products.

| Product                         | Exact ID                               | Current commercial/fulfillment attributes                                            | Order references                                                                                           |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Free Tier / `free-subscription` | `2a167247-3770-4365-ad17-a2e916cf0659` | subscription; price 0 Telegram Stars; interval `day`; topup 3000 Token               | 33: 18 delivering, 6 delivered, 4 completed, 2 canceled, 2 new, 1 canceling                                |
| Pro / `pro`                     | `e939ed88-22ba-4630-86e4-9743ad94338c` | subscription; price 1000 RUB and 1 Telegram Star; interval `minute`; topup 300 Token | 7: 3 new carts, 1 canceled cart, 1 delivered history, 1 completed history, 1 requested_cancelation history |
| Startup / `startup`             | `bb2473b0-9b2e-4dd2-9e38-46806bfde826` | one_off; price 1 RUB plus unbound price 990                                          | 1 new cart                                                                                                 |
| Website / `website`             | `e13709ae-58ea-416f-b6d5-d2802c9f5bce` | one_off; unbound prices 590 and 510, no currency links                               | 0                                                                                                          |

A price Attribute without a Currency association does not establish a working USD offer. New Landing USD 100 and Startup from USD 2000 are current user/root inputs, not prices inferred from these test records. No bot Product exists in the current four-record collection; treat a bot card found in Studio or prose as presentation content, not a missing runtime Product to delete.

Currency IDs:

- Token `0c409156-5614-4fba-9c87-d32d1c256b5a`, slug `token`.
- USD `1e20efba-ad34-4173-8c77-e7b282161652`.
- RUB `311da2ee-6ee0-466c-bfca-bd0ecff7b549`.
- Telegram Star `27b48682-8c0b-4960-a10f-e489778283f0`.

Operational Attribute Key IDs are Price `3b7980e7-cdef-4726-beaa-9db8ec0ebdb6`, Interval `920f92df-e58b-4b64-b138-3bf105ebebaa`, Topup `e005389b-41c4-4efb-89a2-6d84a354cfed`. Although the Topup key's display field is `string`, fulfillment reads the Attribute's numeric `number` and its Currency relation.

Free: topup Attribute `352e4ca5-c906-493e-9526-4259d1716f3b`, Product relation `deb1adaf-d7ec-43e0-a710-60f76f8e94d5`; day Attribute `08473c38-270c-4657-a0a6-9af67107f5a5`, relation `992308f3-2436-4bfe-a0f9-f302c51cd751`. Pro: current topup Attribute `5bc4ac3a-4cfb-4289-a0cd-6cc839a7c9ed`, relation `92527157-52e8-4533-88f7-5b0d178e6876`; minute Attribute `e1fefd64-ea15-4f6e-9871-f24a7e942bd6`, relation `7f413699-39e9-465a-aef2-cd8db92f33d0`.

## Protected references and existing orders

Preserve Pro Product ID and its exact private-content/role associations:

- Private Article `5ade2625-007e-4c90-86bd-989a33e534fa` → Pro relation `b7722336-de44-4760-9b67-b1bf92102b3b`, variant `subscription`.
- Pro → Role relation `d0046fc6-c883-4c5f-b3d8-bcf9c4b36618`, Role `64c8b75d-ea2e-4887-9079-6d9324aad66c` / `pro-subscriber` (one current Subject grant).
- Free → Role relation `f464b231-a9b5-4157-a93a-22096aaacff2`, Role `459f54d4-c136-4a8a-8b3c-a3e2e15452fa` / `free-subscriber` (thirty-six grants).

The inventory has thirty-three linked Invoices: thirty-two paid, one open. All forty-one Orders currently have null fixed-period fields. The existing Pro paid histories are delivered Order `79351877-e228-4e10-956b-bc129709c200` with paid Invoice `ea05d0f6-0f30-4014-a157-ee5448242032`, and completed Order `adb39b9a-c27c-4962-a338-0e5dd5b24c78` with paid Invoice `4fc92781-bcf7-4f24-8537-a8d3003c6677`; both amount 1 Telegram Star. Requested-cancellation Order `90e901f5-25c8-4020-af51-ba871f0a3be2` has an open Invoice, not paid access. No Pro Order in this snapshot is delivering with a valid fixed period. Do not convert these histories into new entitlements by changing an interval.

Checkout derives prices and intervals from current Product attributes (`ecommerce/order/.../find-by-id/checkout-attributes.ts:216-268,271-344`), rather than immutable Product snapshots. Before changing commercial attributes, recheck for newly active legacy orders and use the existing server-owned legacy period freeze where eligible, using the old canonical interval. Preserve existing Invoice amounts, ownership links, revocation markers and balances. Do not run `proceed` as part of a content publication command.

## What the free allowance actually does

`rbac/subject/.../service/singlepage/index.ts:446-470` runs `freeSubscriptionEnsure` from completion of successful user authentication. This includes login/exchange paths, not an unconditional anonymous Subject creation grant. `billing/free-subscription.ts:146-171` skips any apparently active subscription and selects the literal `free-subscription` Product with type `subscription`. Lines173-345 require zero price and Currency and invoke the trusted checkout using dummy, or Telegram Star for Telegram. Lines 79-114 and 317-325 skip a Subject with any previous Order containing that Product. Lines 357-410 settle the zero-price Invoice and run delivery before returning the authenticated session.

This supports retaining the exact Free Product internally while excluding it from public catalog curation. Removing its record or renaming its slug breaks the current bootstrap; user intent does not require deleting that internal record.

The previous-order guard is not sufficient for once-under-concurrency. `telegram/checkout-free-subscription.spec.ts:220-258` explicitly expects two simultaneous calls to perform two independent checkouts. The general Free service has no enclosing Subject claim/lock. Existing repository `withOrderDelivery` (`rbac/subject/backend/app/api/src/lib/repository.ts:12-26`) provides transaction-scoped Subject and Order advisory locks for delivery, but it is not currently around the free eligibility/checkout decision. A retry must also resume an existing partially settled free checkout instead of creating a second grant or permanently skipping the first incomplete one.

## Actual credits, expiry and AI permission

Internal Token is a money-normalized credit, not a model input/output token: `billing/open-router.ts:3-5,59-73` defines USD 0.001 per internal Token and one-Token precharge; final provider cost across calls is rounded upward. `billing/balance.ts:16-46` sums every Subject balance row for Currency slug `token`, including negative rows. The snapshot contains nineteen Token balance rows.

Exact current AI request policy:

- POST permission `39f196df-0f4a-4f4f-8c7d-c8071dd0f6c1` for `/api/rbac/subjects/[rbac.subjects.id]/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/messages/[social.messages.id]/react-by/openrouter` has zero Role links.
- Billing relation `b8633f18-26cb-4720-a980-32f4f62f3728` requires amount 1 in Token Currency.
- Both Free and Pro Roles currently have zero Permission links. No product-role requirement is therefore added to this AI route by those grants.
- Controller `.../controller/singlepage/index.ts:634-639` applies `RequestProfileSubjectIdOwner`. Public role policy is not permission to access another Subject's Profile.
- `billing/route.ts:78-82,225-253` requires aggregate balance at least the precharge, currently 1. The local implementation does not implement the Studio document's advertised −2000 admission threshold. Treat that as a documented discrepancy, not a new promise or an implicit scope expansion.
- The inventory contains only two `/api/agent/...` saved permission entries, public count GETs. No saved Agent execution/tool permission is bound to Free or Pro. This audit does not claim every dynamically selected AI tool is publicly executable; each owning command's existing checks remain in force. Nothing in the observed Free/Pro role graph establishes an AI Chat paywall independent of balance.

Thus a registered top-up-only user can retain current AI request access after Free/Pro Role expiry if their own Token balance remains sufficient. The existing lifecycle currently defeats that intention:

1. `ecommerce/order/proceed.ts:976-1005` zeroes **all nonzero Subject currency balances** when processing delivered status. The canceling branch independently zeroes **all Subject currency balances** at lines 394-419. Neither path distinguishes free, subscription or purchased credits.
2. Lines 1008-1098 can create a new zero-price subscription checkout after expiry, without a Free Product exception. A daily free Product can renew and refill despite the free bootstrap's previous-order guard.
3. `collectTopupCurrencies` lines 632-674 reads `Attribute.number` but does not multiply by `OrderProduct.quantity`; checkout price does multiply quantity (`checkout-attributes.ts:268`). A two-pack order must not charge twice and credit once.
4. `collectTopupCurrencies` lines 557-666 suppresses a credit when the same Product occurs in any delivering Order. The established affected trigger is a second paid Pro Order while another Pro Order is delivering. Ordinary one_off packs normally move to approving, so no reproduced repeat-pack defect is claimed from this predicate. Credit idempotency must follow the accepted Invoice/Order, not Product-wide delivery presence.
5. `renewSubscription` lines 1506-1535 locks the Order and calls only `acceptSubscriptionPeriod`; it does not execute any credit mutation. A newly accepted paid Invoice on the same recurring Order can extend its period without adding the promised allowance. Same-Order renewal therefore needs the same atomic invoice-acceptance/credit flow as initial delivery.
6. Initial paid delivery is transaction/Order-lock guarded (`proceed.ts:683-697`); subscription period/invoice acceptance is checked before credit (`710-786`), and balance updates use conditional writes (`836-890`). Retain these protections, explicit revocation and private-content entitlement checks.

## Studio commercial evidence and unresolved inputs

AI Chat Product `apps/studio/workspace/products/singlepage/ai-chat/product.md:173-190` and Website `.../website/tokens.md:25-71` state 0.13 RUB per internal Token and five top-ups priced 100/300/500/1000/3000 RUB, with no larger-pack discount, nonexpiring purchased Tokens and full reversal of failed/cancelled AI deductions. USD 0.001 is provider-cost value; it is not a claim that the retail price is USD 0.001. No exact internal-token quantities or fractional-credit rounding rule is defined for those RUB packs. For example,100 ÷ 0.13 is not an integer. The current balance writer uses six-decimal normalization (`billing/route.ts:74-75`); adopting that precision for packs is a plan decision, not a verified existing pack configuration.

No runtime standalone packs exist yet. Pro is a test one-minute subscription with 300 credits; its stored 1000 RUB price does not establish the new price or period for 5000 credits. Await the user's explicit Pro price/period and top-up policy. Landing USD 100 and Startup from USD 2000 are current instructions; Studio's AI Chat documents describe future page/deployment offers as not yet priced, so record the new user attribution rather than treating those older documents as their price source.

## Exact public cleanup graph

Current unfiltered Product reader: `rbac/widget/frontend/component/src/lib/singlepage/subject-me-ecommerce-module-product-list-default/Content.tsx:7-35` calls Product `find` with no filter. Its saved RBAC Widget `49cd582a-5ab2-4916-9660-801bf9064df0` is connected by Host external link `e2514b33-0bd3-43e3-960e-9ddec897d66c`, Host Widget `b7043b22-8004-47d1-a6d7-3a30cfe658dc`; Page associations serve `/framework` and `/ecommerce`. Merely unlinking Product memberships cannot hide Free/test Products from this reader. There are zero current Ecommerce Widget→Product links. Public curation requires a real stored selector/association and corresponding reader; do not hardcode screen IDs or turn presentation variants into business availability flags.

Current Category records:

- Design `17c22db6-6aaf-4d7d-902d-231546498b49`; Website membership `bdaec4f9-4748-41ac-b155-cabe8d03b10f`.
- Web Development `abf51ebe-65dd-4047-bf02-ae345d6eda7e`; Startup membership `4ee09072-1426-4c30-b598-bb7d14fb6861`.
- Empty junk `2cf6ff78-b931-449d-9471-803910224b1e`, slug `important-tomato-bonobo`.
- Category Widget `6b47aa01-1d1b-4cd3-ba34-4de9c2ade6af` currently has only Web Development membership `573d2c88-3118-4b24-912b-66215fb7a694`; its Host external link is `feea8a5f-925d-4b15-95f2-e5237a7d06d9` (Host Widget `9be68bba-41ef-4558-9a83-79c1b2218de0`).

Store `92aefa1f-247b-49a9-b1b9-c8029cc840dc`, slug `single-page-shop`, has Website membership `92a451ea-95f5-447d-9390-ae057acd40bc` and Pro membership `9be0fc96-2def-47f8-9f87-61423ad46ead`. Preserve this Store and all forty-one Store→Order links. Checkout's default-store selection requires exactly one Store when no explicit storeId is supplied (`ecommerce/product/checkout.ts:47-64`).

The API-key section originates in Store default presentation: `ecommerce/store/frontend/component/src/lib/singlepage/default/Component.tsx:44ff` renders all Store→Attributes. Exact Store API-key association is `09a9c65c-f812-413c-a492-d953477652a1`, Attribute `0a93cd6c-a6d6-409c-9b2d-e5679c09ca25`, key `f11a4f3f-6fcc-43fb-bc30-6421ee5d92e9`. Its stored string is nonempty; value is withheld. `/ecommerce` Page `563182ee-1135-45a2-ac4a-32304683ab17` renders Store-list external association `e8b3b798-fe75-4ec1-a095-78c964be3745` through Host Widget `0e414f82-3360-4159-bd90-1a4a4448aea9`. Retiring that public section can preserve the underlying Store/key operational data. Store overview route `/ecommerce/stores/[ecommerce.stores.slug]` uses RBAC external link `7a0952bf-35f6-4317-9c53-e30f8170abf7`, and its earlier Ecommerce direct link `5f8e1208-8d31-4b56-8ebf-e18dcc729533` is already hidden. Do not reactivate it.

## API job triggers and publication window

The API entrypoint has no billing/Order scheduler or existing `disableJobs`/CRON environment flag in the inspected API entrypoints and shared environment definitions. `apps/api/package.json:5-6` starts `bun run --watch server.ts` in dev and `bun server.ts` in start; `server.ts:42-47` serves the composed application. `apps/api/app.ts:552` starts the consistency runtime, whose timer dispatches mutation/revalidation events, not subscription fulfillment (`libs/shared/backend/api/src/lib/mutation-effects/consistency.ts:253-264`). Switching away from watch prevents source-edit restarts; it does not disable incoming Agent requests or payment callbacks.

The repository's scheduler is an external host crontab. `tools/deployer/api/set_cron_jobs.yaml:9-16` installs a once-per-minute authenticated POST to `/api/agent/agents/cron`. The Agent dispatcher reads saved Agent intervals, runs due rows and POSTs each exact slug (`agent/.../controller/singlepage/cron.ts:27-144,203-210`). Relevant independently callable POST routes are `/api/agent/agents/ecommerce-module-orders-check`, `/billing-module-payment-intents-check` and `/rbac-module-subjects-check` (controller `index.ts:60-64,90-94,125-129`). The Order check examines paying/delivering/requested_cancelation Orders and calls each Order's `/check` (`ecommerce-module/order/check.ts:10-14,31-65`); Subject check calls `ecommerceOrderProceed` (`rbac/subject/.../controller/singlepage/check.ts:20`). No local installed crontab or external caller was inspected in this follow-up, so absence of an active caller is not established by these source facts.

Request-driven Observer pipelines can also fulfill orders. `apps/api/app.ts:457-458` enables Observer middleware. Successful POST/PATCH/DELETE requests can start stored pipelines without awaiting completion (`libs/middlewares/src/lib/observer/index.ts:55-65,149-176`). Checkout registers payment-provider webhook → Order check and Order PATCH → owning Subject check (`rbac/subject/.../ecommerce/order/checkout.ts:802-858`). The middleware has a constructor `skippedRoutes` extension, but no environment-wide jobs switch; its current default only skips Broadcast routes. An exclusive publication window must therefore stop or isolate the actual cron callers, payment/webhook/Telegram clients and interactive writers, and wait for existing requests/pipelines to finish. Do not invoke any Agent cron/check, Order check/proceed or authentication bootstrap during publication. Keep all forty-one protected Orders, Invoices, grants and balances in the manifest's before/readback comparison; abort on unexpected drift. `--exclusive-maintenance` is an operator acknowledgement, not a database lock or a scheduler-disabling command (`tools/runtime/blog-example-content.ts:1098-1100`; existing maintenance prerequisites in `tools/runtime/README.md:236-240`). No flag, source change or job-disable data mutation was introduced by this research.

## Exact catalog selector representation

There is no current `rbac.widgets-to-ecommerce-module-widgets` relation. The RBAC relation inventory contains Widget links to Website Builder and CRM only; RBAC Widget fields also have no Ecommerce Widget selector. The existing unfiltered reader cannot safely reinterpret the RBAC Widget ID as an Ecommerce Widget ID.

The minimum proposed representation is an RBAC-owned `widgets-to-ecommerce-module-widgets` relation, following `widgets-to-crm-module-widgets/backend/repository/database/src/lib/schema.ts:10-30`: UUID owner `widgetId` references RBAC Widget; UUID target `ecommerceModuleWidgetId` references Ecommerce Widget; standard metadata; unique owner/target pair. RBAC may depend on Ecommerce under the confirmed module order. Generate its migration with the relation's `repository-generate` target and register the standard API/SDK/find/default/admin components; this is a new plan decision, not an existing source or saved record.

The RBAC commerce Widget selects exactly one target through that relation's `variant="find"` filtered by its own ID. The higher RBAC composition then reads Ecommerce `widgets-to-products` using the selected **Ecommerce** Widget ID and preserves each relation's stored ordering. That relation already owns Product IDs (`ecommerce/relations/widgets-to-products/backend/repository/database/src/lib/schema.ts:17-24`). The current CRM bridge demonstrates the exact two-hop selection pattern (`subject-me-crm-module-form-request-create/ClientComponent.tsx:37-75`). Subject commerce cards remain in RBAC and receive Product records through explicit props/slots; the lower Ecommerce module must never import Subject or know RBAC screen IDs. An empty Product selection stays empty, while a missing or ambiguous owning-Widget link shows unavailable configuration instead of falling back to every Product. This preserves the distinction between saved public curation and Product presentation variants.

## Proposed minimum implementation and verification

These are proposed actions for the plan; no implementation was performed.

1. Retain exact internal Free Product, its 3000 topup and previous-order history, but exclude it from every public catalog selector and prevent self-service repeat acquisition. Serialize eligibility, creation and delivery recovery for one successful initial grant under concurrent authentication; no new anonymous/background grant.
2. Keep balances additive and nonexpiring across free expiry, Pro expiry, cancellation, revocation and purchased packs. Remove blanket reset; exclude Free from lifecycle renewal. Keep Role/period expiry independent of existing credits and retain Pro's private entitlement guard.
3. After commercial confirmation, configure Pro 5000 credit per accepted paid period/invoice. Preserve Pro ID/Article/Role links. Tie initial delivery, a second valid paid Order and same-Order renewal to accepted Invoice/Order idempotency in one transaction; remove Product-wide credit suppression. A metadata update or replay of the accepted Invoice must not credit again.
4. Add one_off top-up Products with explicit Price and Topup Currency associations from confirmed terms, using deterministic slugs and exact IDs returned by SDK. Make credited quantity agree with paid quantity and validate finite positive values; retain conditional balance writes and failed-request reversal.
5. Curate the public catalog/categories through saved owning data and shared readers; remove old test memberships/Store section from public display. Retain referenced Product, Role, Order, Invoice and operational Store records. Retire empty junk Categories only after a fresh incoming-reference check; otherwise hide public memberships.
6. Use a maintained `tools/runtime` command with read-only prepare, private0600 before manifest, API-origin binding, exact-record version checks, returned-ID remapping and persisted per-operation recovery. Snapshot private Article subscription relation, roles/grants, Orders/Invoices/periods and balances as protected observations. No billing fulfillment is invoked by publication. Create/configure/read back new records before switching public associations last. Repeat apply and fresh prepare should need zero writes; rollback restores presentation associations while retaining additive paid records and security.

Required focused tests: simultaneous registration/login yields exactly 3000 once; retry after partial/unknown checkout resumes; existing free history and old paid users do not receive duplicate grants; Free expiry produces no renewal and leaves purchased/free balances unchanged; expired Pro without Role still permits own AI with sufficient credits but denies private Blog; successful Pro paid invoice adds 5000 once, retry zero, a second valid paid Pro Order is not suppressed by another delivering Pro Order, same-Order new paid Invoice/period credits once, revoked Order retry adds zero; two-pack quantity credits twice; no paid credit for unpaid/canceled Invoice; no cross-subject balance/account operations; catalog empty curation never falls back to all Products; no Free/junk/Store API key in public page output; tool stale/unknown-response/idempotency protection and unchanged private/order/balance snapshots.

Existing test homes: `billing/free-subscription.spec.ts`, `telegram/checkout-free-subscription.spec.ts`, `ecommerce/order/proceed.spec.ts`, `proceed.integration.spec.ts`, `billing/balance.spec.ts`, `billing/route.spec.ts`, `billing/open-router.spec.ts`, `ecommerce/product/checkout-effects.spec.ts`, and `apps/api/specs/integration/private-content.integration.spec.ts`. These suites were inspected as research; none was run or modified by this worker in this follow-up.

Known maintained Blog cutover remains `tools/runtime/blog-example-content.ts`. No new source-link transformer path was supplied to this worker; root's verified path-to-blob/main or nearest tree/main mapping policy should be carried into the owning editorial input/transform flow without altering B2's protected Widget graph.

## Source-link evidence

39 source paths occur in the six bilingual articles. The GitHub connector verified 29 files on main. Ten local-only files map to their nearest published directory with an explicit directory/local-file label. Code examples remain unchanged. Root prepared 88 TipTap link marks across 12 bodies; this is a draft, not a CMS publication. File and directory mappings will be retained with the maintained publication flow.

## Free bootstrap transaction feasibility — plan verification

The current checkout is unsuitable for holding a Subject transaction across it. `ecommerce/product/checkout.ts:155-212` creates Order, Subject/Product/Store/Currency associations through self-HTTP SDK calls. `ecommerce/order/checkout.ts:745-799` then creates PaymentIntent and invokes the provider through self-HTTP. The provider's zero-amount branch creates an open Invoice and schedules a self-webhook (`billing/payment-intent/.../controller/singlepage/provider/index.ts:93-160`); its dummy service also calls Invoice and association SDKs (`.../service/singlepage/index.ts:699-800`). A direct call to the current provider service is therefore not a transaction-safe replacement for its HTTP endpoint. Existing `FreeSubscription.activate` polls Order check and proceed; wrapping that operation in the Subject lock can block the separate HTTP/Observer delivery needed to finish it.

Root agreed the proposed minimum: a bootstrap-only trusted Service entry, with no request/body trust flag. Under the common Subject lock and ambient DB transaction, re-read the authenticated identity, configured exact Free Product and owned Free history. Accepted or completed historical Free delivery skips another grant. Resume one safely identified incomplete zero-price graph; abort ambiguous or inconsistent history. Validate zero Price and Currency, interval and 3000 Topup before writes. Use direct owning Services for Order (`history`, initially `paid`), Subject→Order, Free Product quantity 1, Store→Order, Order→Currency, zero succeeded one_off PaymentIntent, Order→PaymentIntent, PaymentIntent→Currency, paid zero Invoice and PaymentIntent→Invoice. The Invoice retains an internal zero-settlement provider policy; no external payment, provider method, delayed webhook, polling or self-HTTP runs inside the transaction.

Trusted in-transaction paid fulfillment must apply Role, accepted Invoice/period anchor and additive credit together. Reuse the existing durable Order/Invoice acceptance anchor for replay protection; no new grant table or queue is needed. Return notification/effect descriptors from the transaction and dispatch existing effects after the outer commit resolves. Existing `fromPaidStatus` notifies after its own transaction (`proceed.ts:683-708`), so calling it inside an outer transaction without separating its effects would notify before that outer commit. Current credit math also adds three credits per invited profile (`applyPaidStatus` around lines 854-858); the exact initial 3000 promise needs explicit trusted-Free handling and a test without changing paid reward behavior.

The required typed facade extensions are `create` on Billing `paymentIntent`, `invoice`, `paymentIntentsToCurrencies`, `paymentIntentsToInvoices`, and Ecommerce `ordersToBillingModulePaymentIntents`; their existing bootstrap objects are already direct `CRUDService` instances (`rbac/subject/.../bootstrap.ts:339-343,488-511`). Existing Order, Product/Store/OrderCurrency and Subject ownership Services already expose the other writes. Owning repositories resolve the shared ambient transaction through `Database.db` (`libs/shared/backend/api/src/lib/repository/database/index.ts:39-43`) and `withConsistencyDatabase` (`context.ts:280-304`). Root owns the common repository lock/facade wiring. This section describes the agreed plan contract; no source or data implementation was performed.
