# ISSUE-376 round 2 — current acceptance checkpoint

Checkpoint: 2026-10-24; baseline implementation `18f454fef1`, documentation
`922d823da6`, plus backend-guard and two Category CSS corrections in `e39747ae4e`.
Independent final verdict: PASS by code_review_readiness for human Code Review.
GitHub Project status is verified as Code Review. Human acceptance remains open.
Earlier sections below retain their phase/revision
scope; pending statements there describe those historical checkpoints.

- Completed production target: build ID `MKpFtIHdiJJQqecTuXDQO`, Next/Nx success,
  type validity, static generation 8/8, optimization/traces/manifests. Built HTTP matrix:
  18 EN/RU paths twice,36 responses 200, maximum 0.826 s, no error/private markers.
- Supervisor limitation: outer exit 1 after EPERM signalling an already-exited
  group; no final RSS receipt. A sample reached 2803.1 MiB at 516.7 s; no complete
  peak is claimed. The helper race is fixed without recompiling for bookkeeping.
- Backend correction: only accepted normalized UUIDs reach the mutation record
  lookup. Named actions retain body/private-reference checks. Access 20/20 PASS
  in 1.401 s; actual private PostgreSQL/Hono/Redis/both-cache/bytes 1/1 PASS in 22.233 s;
  six final changed files pass ESLint.
- Auth/API: B registration 201; A committed before a temporary JWT adapter error
  returned 500, then normal UI login A succeeds. Each fixture has one Identity,
  Profile, Free Order, paid zero Invoice and 3000 tokens. Article retry returns
  the same graph; foreign collision 409 and cross-Subject 401.
- Built browser: publication/feed/UUID author/menu, three-field draft disposal
  on A logout/B login, guest editor gate and B private denial pass; console
  errors 0. This does not claim a paid-subscriber browser session or new CRM submit.
- Cleanup:92 recorded fixture IDs removed, pre-existing drift 0 and all captured
  nonfixture hashes preserved. Read-only review confirms both fixtures absent
  and preserves four default orphan guest Subjects with no references across 12
  FK columns. Their origin is unassigned. Fresh commercial preparation again
  has 0 operations across 77 targets with 84 protected selections.
- Normal API/Host dev sessions 19270/6711 are restored. Host Ready 6.2 s at 1536 MiB
  heap/1024 MiB native target/2 threads. Final dev Framework 200 after 83.643 s cold
  compile; Category 200 in 1.093 s. Public Article/Product API reads 200; authenticated
  consistency status 200, lag 0/pending 0/degraded false/failures 0.
- The completed build predates two class-only Category fixes. Narrow source,
  Prettier/diff and generated CSS checks pass; CSS line 4172 supplies 16/9.
  Desktop frame 1216.015625 × 684.00390625 with absolute child/cover passes.
  Actual 320 px geometry also passes: frame 272 × 153, computed ratio 16/9 and
  inner/client/scroll widths 320. Independent final review is PASS; commit `e39747ae4e`
  and the Code Review transition are verified.

Primary reports: `ISSUE-376-browser-r2.md`, `ISSUE-376-final-source-review.md`
and `ISSUE-376-final-acceptance.md`. Raw current receipts are named in the
completed verification addendum at the end; credentials and protected rows
are excluded. No PR, push, merge or human Code Review acceptance is claimed.

# ISSUE-376 round 2 — independent research review

Verdict: **PASS for Research** at source revision `55af94890b`. The four reports establish the current behavior, the required corrections, ownership and implementation checks. This verdict accepts the research scope; it does not claim that the identified runtime defects are fixed. Source, CMS, Git and workflow status were not changed by this reviewer.

Reviewed artifacts:

- `/tmp/sps-376-round2-auth-research.md`
- `/tmp/sps-376-round2-frontend-research.md`
- `/tmp/sps-376-round2-shell-research.md`
- `/tmp/sps-376-round2-commerce-research.md`
- Source-link mapping and remote verification in `/tmp/sps-376-round2-source-links.json` and `/tmp/sps-376-round2-github-verified.json`.

The review follows review-pr, the frontend/component and module-order contracts, code-placement guidance and the relevant owning code. Load-bearing authentication/ownership, raw Profile, shell/About, Free provisioning and paid delivery paths were inspected at the stated revision. No test-suite or browser acceptance is claimed during Research.

## Research finding resolved in scope: raw Profile privacy

**P2 — a safe author DTO alone leaves generic full Profile reads public.** Anonymous read-only HTTP independently reproduced list200 with63 records, including27 artificial-intelligence Profiles and26 Subject-derived slugs. The returned shape includes adminTitle and allowedMcpServerIds. Count returns63, and an AI Profile detail returns the full shape. Profile→Chats returns403; this reproduction does not establish Chat/Thread exposure. No private values or identifiers were printed.

The final auth addendum includes the exact three roleless permission rows, their consumer inventory and the correction: an owning RBAC guard for raw Profile list/count/UUID GET and HEAD, installed before both response caches; exact raw-cache exclusions; fresh explicit administrative Role/operator checks; and supported SDK binding of those existing permissions to an administrative Role. Social does not import RBAC. Public author endpoints are excluded from the raw-route predicate.

The consumer migration is required before restriction: Article bylines and Product seller links use the public author DTO; own account/settings retain Subject-scoped readers; current and historical private Chat senders/actors receive scoped presentation/avatar data. Public-author eligibility cannot substitute for private Chat access. Ordinary users cannot regain full Profile reads merely by being registered. Warm-cache/admin-revocation and authorized owner/admin/Chat compatibility cases are explicit implementation criteria.

This resolves the research omission. The baseline exposure remains until implementation and rollout pass those criteria. Existing public relation rows contain resource IDs and presentation metadata; the audit does not prove a separate private-body exposure through them. Their current policies remain unchanged within this scope.

The stale Subject README collection section is also identified: it still advertises shared-Chat Profiles and default Profile creation, while actual code scopes exact ownership and accepts AI creation only. The plan must update that documentation with the ownership work.

## Settled author and creation contract

The public handle is the independent **Profile UUID**: `/authors/[social.profiles.id]`, with `authorFindById`. Public DTOs omit stored Profile slug entirely. No safe-slug migration/backfill or reference rewrite is required. Any earlier slug-based frontend proposal is superseded by this contract; the plan and final public registrations must use UUID consistently.

Existing email/password, EVM and OAuth exchange completion already ensure a personal Profile. Telegram has a separate bootstrap and a supported human transport Profile that current common ensure rejects. Preserve the canonical Profile ID and relations, serialize concurrent ownership resolution, support Telegram explicitly, and use effective owning Services instead of loopback HTTP inside the new transaction.

RBAC owns registered-user Article creation. A matching verified JWT and actual linked Identity are required, including when an operator header is supplied. Guest/agent/foreign callers and caller-chosen author IDs fail. Article, Subject ownership and Social author association commit atomically through their owning Services. The server-owned unique slug `article-${requestId}` provides persisted replay identity because the generic repository discards caller-supplied row IDs. Same request and normalized payload return the same owned result; changed payload or foreign collision conflicts without disclosing the other record. Rich-text validation requires explicit supported nodes/marks/safe links and size/depth/node limits.

Social owns the allowlisted public projection, filtering supported human/editorial Profiles by explicit public Article/Product links before pagination. It excludes Subject/Identity/session/MCP/admin/private Chat fields. An editorial Profile does not require an RBAC owner. Own-account reads remain scoped RBAC regardless of public eligibility. A fresh account without a public link must not receive a dead My author page destination; settings and Create remain available, and the public link appears after an eligible DTO exists.

The module direction remains RBAC → Social → Blog → Ecommerce. Lower Blog components receive author JSX/data slots and do not import Social. Functional author/create widgets own queries and mutations; Website Builder owns the saved presentation. Shared SDK/query/cache ownership, explicit client-boundary props, model/entity skeletons and built RSC checks remain required.

## Commerce findings and policy

Confirmed AI Chat Product Revenue Streams states that tokens do not expire. The accepted policy is Free3000 once, additive Pro5000 for each accepted paid cycle, and quantity×pack topups. There is no stated non-rollover quota requiring separate buckets. Subscription Role expiry/cancellation/revocation remains independent from wallet credits; unrelated currencies must never be reset by an order lifecycle.

The source confirms all required correction paths:

- Both canceling and delivered paths zero all Subject currency balances.
- Zero-price subscription lifecycle renewal bypasses the bootstrap's previous-order guard, so Free can renew repeatedly.
- Free eligibility/checkout lacks a once-under-concurrency claim; partial/unknown checkout needs recovery.
- Initial delivery ignores quantity for topup credits.
- Product-global suppression can reject a second valid paid Pro Order while another Pro Order is delivering.
- Same-Order renewal accepts the new period but does not run wallet credit logic.

Plan these together: one atomic accepted-Invoice/Order credit decision with conditional balance writes, repeated delivery/replay protection, Free once/recovery, quantity agreement, and no credit from unpaid/canceled/revoked transitions. Preserve exact expiry/revocation/private-content tests and failed/canceled AI charge reversal. Eligibility must distinguish successful Free history, resumable partial Free and unrelated unpaid Pro carts rather than relying on any apparently active subscription.

Pro price/period and topup prices/quantities remain operator facts until supplied. Existing one-minute/300-credit Pro and old Product-document pack prices do not establish those new terms. Landing USD100 and Startup from USD2000 are current instructions. Research can advance while those inputs remain explicit; their commercial data application must stay gated.

The unfiltered public Product reader must be replaced by explicit saved curation; removing memberships alone cannot hide products. Empty curation must not fall back to all Products. Preserve internal Free, Pro's exact protected Article/Role links, Orders, Invoices, periods, balances and operational Store. Remove the Store/API-key section from public composition without deleting operational data. Public portfolio uses Profile→Product links, not the private AI project aggregate.

## Shell, About and publication

The SDK inventory identifies the actual navbar/footer/logo records and the About Page association to the shared Blog Widget. Replace only About's Page association with dedicated static Website Builder sections; do not repurpose the shared Blog record. Use the registered S mark and Product/Website visual/content references without importing Studio preview components into runtime or altering their approval metadata. Footer groups need real destinations and a dedicated ButtonsArray footer presentation so header arrays do not gain duplicate headings. Account operations remain in RBAC/Host, outside Website Builder.

Source-link mapping has39 paths:29 file links with recorded live remote verification/SHA and10 explicitly local-only paths linked to their nearest published directory. The directory URLs match their recorded ancestors, and those ancestors exist in local origin/main. No unpublished file is presented as an existing blob/main file, and no push is required. The final prose/TipTap transformation must retain that distinction and remain repeatable.

Data changes need a private before manifest, exact references/version checks, actual returned IDs, resumable unknown outcomes, readback, repeat/fresh-zero-operation preparation and rollback that retains additive paid records and security. Freeze eligible legacy periods with their old interval before changing commercial attributes; do not invent access for old paid histories. Publication must not invoke fulfillment. Scheduler/Observer/direct API callers are documented; no jobs-disable environment flag or proof of absent callers exists. An exclusive-maintenance flag is an operator precondition, not a database lock. The plan must establish writer quiescence or bounded conflict/abort behavior before protecting live financial observations.

## Next gate

Plan review must settle exact DTO/API names, public pagination/count behavior, transaction/lock/replay mechanics, raw-Profile guard/cache order, Chat fallback migration, saved Widget/relation ownership, Studio/runtime registrations, operator maintenance steps and evidence commands. Required checks include real database rollback/concurrency, warm caches and another principal, both response-cache modes, actual production build and desktop/mobile/session flows. Those are implementation requirements, not results of this research review.

# ISSUE-376 round 2 — independent plan review

Verdict: **PASS** for the corrected canonical plan `thoughts/shared/plans/singlepagestartup/ISSUE-376-platform-followup.md`. The two blocking plan findings are resolved. Unblocked implementation may proceed in the assigned ownership areas. R2.5b remains a separately pending commercial data phase.

Review scope: round-2 plan against source baseline `55af94890b` and accepted research. Metadata commit `f05e582fcd` does not implement these behaviors. This reviewer read the actual checkout, Free provisioning, delivery and public-Profile paths, then reread the final two corrections in the canonical artifact. No source/CMS/Git/status mutation or implementation test acceptance is claimed by this review.

## Resolved blocking findings

### P1 — Free transaction strategy left the existing HTTP/provider path inside the proposed lock

The earlier plan required one Subject transaction but did not replace the transport actually used by Free: Product checkout creates its graph over SDK HTTP; Order checkout writes PaymentIntents/relations and registers provider/Observer work; Free.activate polls Order.check/proceed. Wrapping that path in the same delivery Subject lock would not enlist those separate requests and could block a nested delivery waiting for the lock. This was an established code-path risk, not a reproduced deadlock.

Corrected R2.2 uses a narrow internal direct-Service Free operation. It creates or resumes the exact zero-price graph, including Intent/Currency/Invoice associations, using effective owning Services and the shared ambient transaction. The internal PaymentIntent is one_off; Product/Order subscription period behavior remains explicit. The operation does not invoke ordinary checkout, provider transport, Observer registration or polling. Normal paid checkout retains its current transport.

The lock order is the existing delivery Subject key, then Order advisory lock and the owning lifecycle row lock. A transaction-aware fulfillment core joins the same transaction. Eligibility, zero settlement, accepted Invoice/period, Role and exact3000 balance credit commit together. Returned effect descriptors execute only after the outer commit. Initial Free excludes the old referral addition; paid referral behavior remains outside this change. There is no new claim table or queue.

The real-PostgreSQL acceptance now tests concurrent Free/ordinary delivery, one persisted graph, failures after graph/paid settlement/balance update, rollback, retry after unknown committed response, legacy duplicate pending Orders, and no network transport. These criteria make the intended atomicity reviewable at implementation time.

### P2 — public author pagination had no public count contract

The earlier plan specified Summary[] reads and promised pagination/count without naming a safe count operation; the generic Profile.count is now private.

Corrected R2.1 declares authorFind → IAuthorSummary[], authorFindCount → number, and authorFindById → IAuthorDetail|null. Named GET/HEAD routes register authors, authors/count and authors/:id before generic UUID handling. List/count share eligibility and semantic filters; count precedes pagination. Typed SDK results, separate query keys and exact missing-only public permissions are explicit, and fallback to generic Profile.count is prohibited.

## Accepted boundaries

- Profile UUID is the public handle; stored slug and Subject/Identity/MCP/admin/private Chat data remain outside public DTOs. No slug backfill is needed.
- Raw Profile guard and exact cache exclusions precede both response caches. Fresh operator/explicit administrative permission is required even while legacy roleless rows exist. Public DTO consumers migrate first; own-account and current/historical private Chat presentation keep their resource scope. Policy rollback must not reopen private reads.
- Article creation uses matching JWT plus Identity, server-selected personal Profile and atomic Article/owner/author/category writes. Durable request slug, normalized payload comparison and exact relation proof handle retries/collisions. Code blocks are optional; server EN/RU normalization and current-locale UI requirements are now distinct.
- Free once/recovery and paid-cycle/quantity credits share the accepted lifecycle protections. Subscription access and wallet credits remain separate; blanket currency resets and Free renewal are removed. Implementation must prove the existing revocation/expiry/payment invariants rather than replacing them.
- Account/backend, fulfillment, frontend, shell and catalog-relation files have separate owners; root integrates shared DI/facade/repository/API/Host edits. The module direction remains valid and no lower module gains a higher import.
- Studio recipes precede production presentation variants. Required public registries, props unions, reader/client roles, JSX slots and loading states are listed. Runtime does not import Studio or fixtures.
- Explicit RBAC→Ecommerce Widget relation replaces unfiltered catalogue reads. Missing/ambiguous target or empty curation does not fall back to all Products. The new relation requires its generated migration and ordinary API/SDK/admin/projection registrations.
- About changes its Page association, preserving the shared Blog Widget. Shell uses actual saved records and registered assets. Source-link transformation preserves the verified published-file/local-directory distinction without push.
- Operator data flow requires exact manifest/origin/references, protected records, recovery/readback/repeat/rollback and maintenance preconditions. Those conditions remain deployment evidence requirements; a maintenance flag does not itself lock the database.

## Pending commercial phase

Separating R2.5b is acceptable. Backend invariants, typed fixture tests, Studio/runtime work, public-author privacy, shell/About, source links, explicit catalog selection and confirmed changes can proceed without inventing prices.

Pro price/period and pack prices/credits/rounding must come from a complete confirmed input manifest before R2.5b writes them. No zero-price placeholder packs or guessed terms become available. The existing Pro price/period remain current until that cutover; they are not represented as the newly confirmed offer. Fixture prices/periods used for tests are evidence of code behavior, not public commercial terms.

The whole requested commercial application is not complete while R2.5b is pending. Final task completion requires those inputs or the user's explicit deferral. Reports/status must preserve that distinction; this plan approval does not supply missing operator facts.

## Implementation acceptance remains open

Plan PASS authorizes the defined work, not its result. Each implementation gate still needs the planned real PostgreSQL transaction/concurrency checks, warm-cache and principal-isolation cases, both response-cache modes, scoped Chat/account compatibility, generated migration evidence, Studio/module/placement checks, final production build and actual desktop/mobile/session flows. Final Code Review remains with the user; no PR, push or merge is created by this review.

## Recovery verification — root publication tool

`bun test --tsconfig-override ./tsconfig.base.json tools/runtime/platform-example-content.test.ts`: exit 0, 5 passed, 20 assertions. Covers server-ID remapping, repeat/fresh prepare, unknown create recovery, stale and protected-collection drift, presentation rollback with retained configuration and commercial input validation. Bun printed an internal directory-mismatch diagnostic but executed all tests successfully. This focused result does not accept the whole phase or replace independent review.

## Recovery verification — R2.1 backend

After the machine restart, root authorized one serial focused run with a fixed 1536 MiB heap limit. No Nx worker, watcher, server, TypeScript project check or build was started by this worker.

```sh
NODE_OPTIONS=--max-old-space-size=1536 node node_modules/jest/bin/jest.js --config libs/modules/rbac/jest.config.ts --runInBand --runTestsByPath libs/modules/rbac/models/subject/sdk/model/src/lib/blog-article-create.spec.ts libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/create.spec.ts libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/raw-social-profile-read/index.spec.ts libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ownership.spec.ts
```

Result: exit 0; four suites and 32 tests passed in 0.625 seconds. Node emitted the existing punycode deprecation warning. The tests cover strict Article payload/rich-text bounds, server-selected ownership/authorship/category writes, durable retry and conflict behavior, simulated transaction rollback, common Subject-lock use, Telegram personal-Profile reuse, operator and fresh explicit Role-bound raw-Profile access, revocation, HEAD and UUID aliases. They do not prove real PostgreSQL concurrency/rollback, response-cache placement or browser behavior; those remain integration gates.

The Article operation follows the project's existing controller-guarded own-scope convention: root registers its exact POST shape in controllerGuardedRoutes, matching JWT middleware rejects a foreign Subject and the Service requires a persisted human Identity. It introduces no roleless write Permission and does not mutate authenticationMe GET. Existing authenticated sessions do not need a permission backfill merely to invoke this guarded command.

## Recovery verification — R2.2 focused units

```sh
NODE_OPTIONS=--max-old-space-size=1536 node node_modules/jest/bin/jest.js --config libs/modules/rbac/jest.config.ts --runInBand --runTestsByPath libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/free-subscription.spec.ts libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.spec.ts libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.spec.ts
```

Final result: exit 0; three suites, 63 tests passed in 1.783 seconds. The first run found three outdated fixtures/assertions: unpaid settlement now safely skips without logging an exception, and two old extended-Order fixtures lacked the Product record. Those fixtures were corrected and the same bounded command passed. Node emitted punycode and url.parse deprecation warnings.

Coverage includes direct-Service Free settlement without HTTP, one grant under serialized authentication retries, closed/canceled history, unrelated Pro cart, partial graph ID preservation, simulated graph/settlement/balance rollback, retry after an unknown committed result, Telegram delegation, no Free renewal, additive wallet retention, paid renewal once per accepted Invoice, quantity aggregation and invalid numbers. Real PostgreSQL proof remains separate.

Two bounded source corrections accompany these tests. Known canceled/canceling/requested-cancelation or explicitly revoked Free history skips the gift without preventing login; missing rows and ambiguous unaccepted history still require reconciliation. Free.execute also rejects an existing ambient database transaction before writes. The shared context has no outer-commit callback, so top-level Free must own the transaction whose completion precedes effect dispatch. Current authentication and Telegram flows already invoke it outside another transaction. Internal fulfillPaidOrderInTransaction remains composable and returns effects for its outer transaction owner. Root accepted this adaptation; it adds no queue or infrastructure layer.

The maintained PostgreSQL source now includes a real disposable Free graph test alongside the paid fulfillment integration test. The Free fixture uses actual Product, Store, Currency, Identity, ownership, Order/Intent/Invoice relations, Role and wallet records through owning repositories and shared CRUD/Period/Balance/Grant Services. Only its graph reader aliases disposable Product/Currency slugs and supplies typed attribute projections; configured commercial records are untouched. These sources require successful database execution before acceptance.

### PostgreSQL command — first recovery attempt

```sh
NODE_OPTIONS=--max-old-space-size=1536 node node_modules/jest/bin/jest.js --config libs/modules/rbac/jest.integration.config.ts --runInBand --runTestsByPath libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/free-subscription.integration.spec.ts libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.integration.spec.ts
```

The first run exited 1 in 2.775 seconds: both suites, all six cases failed with AggregateError at their initial database access. No heap failure or passed integration assertion is reported. The run used the default execution sandbox; local TCP access needs verification before interpreting this as a code failure. Root was notified and a network-enabled retry was requested. No successful fixture creation or protected-data mutation was observed from this attempt.

### PostgreSQL command — completed recovery verification

The identical command above then ran with approved local TCP access, still serial and capped at 1536 MiB. The first network-enabled run took 3.417 seconds: all five Free cases passed, while the paid test stopped when its fixture supplied Invoice.createdAt. The Invoice repository correctly rejected that server-assigned field. Removing that fixture field let the next run reach all paid-cycle, second-Order and quantity assertions, then reject the fixture's direct subscriptionRevokedAt write (2.956 seconds). That guard also behaved correctly. The fixture now invokes Order.revokeSubscription and changes only writable status for the stale-job retry. These were fixture corrections, not weakened runtime guards.

Final identical command: **exit 0, two suites and all six PostgreSQL tests passed in 2.864 seconds**. All afterEach/afterAll fixture cleanup hooks completed. No heap increase, Nx, watcher, TypeScript project check, external notification or payment was used. Punycode and url.parse deprecation warnings remained.

The passing real writes prove Free/ordinary-delivery serialization through the common Subject lock; one accepted initial grant; duplicate legacy job rejection; partial saved-graph and unknown-commit replay; rollback after graph creation, paid settlement and conditional wallet update; and successful retry. Paid tests prove additive 5000 cycles, no credit for OPEN renewal, one credit for a newly accepted Invoice despite retries, a second paid Order while the first delivers, quantity-two pack credit and no credit after revocation. Financial observations in these tests belong to disposable fixture Subjects.

Remaining seams: Free fixture configuration uses typed attribute and synthetic-slug projections, not the project's saved commercial selection. Paid integration also supplies its extended-Order association projection; the actual Order, Invoice, Role, balance, locks and period writes are real. These checks do not accept HTTP authorization/cache placement, full registration/OAuth/Telegram transport, actual notification delivery, current browser sessions, production type/build behavior, public author/editor UI or the final saved catalog. R2.1 Article atomicity still needs a real database integration case; its current rollback/retry tests use a simulated transaction.

## Independent UI source review — R2 account, authors and feed

Verdict: **NEEDS WORK** on the reviewed working diff over `3e6447dbf9fbd90b380ab771684a68dadc7d2d7c`. Scope: the new account/editor, public author views, Blog feed, scoped Chat presentation consumers, their Studio recipes, registries and Host Blog callback bridge. This reviewer did not author these UI changes. Backend fulfillment and author API implementation are excluded from this review acceptance. No build, type checker or browser was run for this source review.

### P2 — domain Widgets bypass Website Builder presentation instances

Established structural finding: `libs/modules/social/models/widget/frontend/component/src/lib/singlepage/author-list-default/ClientComponent.tsx:10`, `author-overview-default/Component.tsx:3` and `libs/modules/blog/models/widget/frontend/component/src/lib/singlepage/article-feed-default/ClientComponent.tsx:10` render their page shell, heading and copy directly. They do not compose a linked Website Builder presentation. When an operator configures the public Authors/feed page, its presentation cannot be selected or edited through the exact Widget relation required by the frontend contract. Every render of these new variants uses this path; this is a contract and ownership finding, not a reproduced browser failure.

Blog and Social do not currently have Widget→Website Builder relations. Their existing Article/Category/Profile associations have different owning IDs and cannot be repurposed. Root authorized the bounded plan adaptation: add the two ordinary owning relations following RBAC's counterpart, generate their migrations, and use find filtered by the exact domain Widget ID plus the default rendered-child forwarding association. Publication must create and verify those exact instances. No new module or inheritance layer is needed.

### P2 — Host dispatches a Blog business variant outside its registry

Established structural finding: `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/blog/Component.tsx:7` imports a private Blog variant discriminator; line 35 branches on it to select the feed's client bridge. Each feed render requires this extra Host business registry, contrary to the generic saved-Widget dispatch contract. The bridge's client-side creation of author callbacks is correct and must remain on that side of the RSC boundary.

The accepted correction uses a typed client render-port Provider in Blog's existing frontend package. A generic Host client wrapper creates its Social/Subject render callbacks and receives the ordinary server-rendered Blog Widget as JSX children. The owning feed consumes those client ports and does not forward a server callback into its client reader. Existing Article/Category server views retain their current server callbacks and SSR. This removes the private variant import and Host screen branch without converting every Blog view to client-only loading. The provider is a render-composition scope, not another query Provider or entity store.

### P2 — a rejected publication leaves the draft permanently locked

Established code path: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/create-default/ClientComponent.tsx:29` disables all fields whenever an attempt exists. The submit path sets that attempt before its request at line 46; the catch at line 51 retains it for every error and exposes only Retry. If the selected Category disappears after the picker loaded, the server rejects the request with validation failure. The user cannot change/remove that Category, and Retry sends the same invalid request again. Leaving the page discards the otherwise recoverable draft. Frequency is unknown; the validation/error path is concrete.

Keep the immutable request snapshot for an uncertain transport result. For a definitive rejection that cannot have committed, provide an edit/new-attempt path that preserves draft fields and starts a fresh request UUID. The user must not be forced to lose the draft to correct a server-rejected Category. Verify both unknown-response retry deduplication and definitive-rejection correction.

### Plan mismatch — current-locale summary is optional

The approved R2.1 plan requires title, summary and body in the current-locale UI while keeping the server subtitle optional for API consumers. The editor's Summary textarea at line 59 is optional in both Studio and runtime. Require it in that UI or explicitly revise that acceptance criterion; do not silently present the optional API schema as the UI requirement.

### Source checks and remaining evidence

The reviewed new imports follow the confirmed module order: Blog does not import Social/RBAC, Social uses its own and lower Blog/Ecommerce capabilities, and RBAC/Host compose them. Public author views use allowlisted DTO SDK operations and UUID URLs; no generic raw Profile read was found in these public paths. Account/editor use authenticationMe's persisted authenticated result, key their mounted state by Subject ID and keep SDK bindings out of explicit client-view props. The editor's RBAC Widget already uses its exact Website Builder relation. List rows are memoized with ID keys; pagination handlers are stable. Scoped Message/Action loaders use the authorized presentation DTOs and do not need public-author eligibility.

The public registry/unions contain the new variants with startup precedence intact. The existing Host Blog client bridge demonstrates safe same-runtime callback creation, but its dispatch still needs the correction above. Type/build checks, actual saved-graph selection, Storybook interactions, HTTP/cache/privacy behavior, inherited browser sessions, registration/first-publication, desktop/mobile layouts and real Chat compatibility remain separate runtime gates. This source review does not mark them passed.

### Host/Blog provider correction — independent source re-review

The Host business-variant dispatch finding is **resolved in source**. The reviewed correction consists of Blog frontend's `provider/interface.ts` and `provider/index.tsx` plus its public exports; the feed's `Component.tsx` and client reader; and Host external Blog's `Component.tsx`, `ClientComponent.tsx` and interface.

Host now always renders the saved Widget through Blog's public registry. It no longer imports the feed's private discriminator or branches on that business variant. Its generic client wrapper receives only language and rendered JSX children, creates the Social author callback in that client runtime and supplies it through the typed Blog provider. Blog imports only its own public author-port type; the provider owns no SDK, query cache or session state.

The feed's server-compatible Component explicitly omits its server renderAuthor callback at the client boundary when isServer is true. Its client reader selects a same-runtime explicit callback or the provider's client port. Existing Article/Category server compositions keep their original server callbacks and isServer value; wrapping the rendered child node does not convert those readers to client-only loading. The complete Page URL map remains inside the Host reader callback.

No remaining established source defect was found in this bounded provider correction. This accepts that finding's source fix only. Production RSC serialization, the rendered SSR Article/Category HTML, feed hydration/bylines, bundler behavior and browser interactions still need their normal runtime checks. The separate Website Builder instance-composition and editor rejection findings are not accepted by this re-review.

Source-only work also includes typed public author list/count/detail SDK operations, authorized current/historical Chat sender and actor avatar projections, and the raw-Profile guard export. The Social author projection and Chat enrichment suites have been authored or updated but were outside this single approved test run. Private Chat presentation may derive a missing localized display title from its existing adminTitle; the public author DTO never uses that fallback or returns adminTitle/slug fields.

## Recovery independent review — publication, catalog relation and Website Builder shell

Reviewer scope: `review-pr` against HEAD `3e6447dbf9` plus the current local changes. This review covers `platform-example-content.ts`, its tests and README, the shared cutover-engine schema extension, RBAC→Ecommerce Widget relation and curated Product reader, Website Builder hero/feature grid/Feature card/footer column/footer/logotype, and the two no-fetch `hidden` relation renderers. The reviewer did not implement these changes. Account/editor/author/feed UI and `content-form` were implemented by this reviewer and are excluded from this independent verdict.

Verdict: **changes requested** for the loaded-record reader finding below. The missing durable capture catalog entry was corrected during review. No other actionable implementation finding was established in this scope.

### P2 — loaded Website Builder rows start additional readers instead of using the owning query

Evidence level: established code path; no runtime latency measurement. `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-feature-find-card/Component.tsx:63` renders a loaded `WidgetsToFeatures` relation with `data={link}` but no `dataSource="props"`. The same pattern occurs in the new hero, Feature card and footer-column compositions. `libs/shared/frontend/components/src/lib/singlepage/default/client.tsx:23` and `server.tsx:25` issue `findById` for that ID; the no-reader path is selected only by explicit props mode in the shared index. Each affected relation row therefore adds a request and Provider after its parent collection has already supplied the record. The default relation target renderers repeat this for their loaded model result.

This violates the frontend contract's single reader/cache ownership for already loaded SDK results. It affects every linked item rendered through these paths; transport/cache cost is not measured here. Add props mode to the loaded relation rows and their loaded target models, retaining the actual collection `find` reader. Root accepted this correction; implementation and focused reader verification remain pending at this review snapshot.

Affected new composition families: Widget `content-hero`, Widget `content-feature-find-card`, Feature `card`, ButtonsArray `footer-column`, and the changed footer/logotype loops. The bounded downstream default renderer set is `widgets-to-buttons-arrays`, `widgets-to-file-storage-module-files`, `widgets-to-features`, `features-to-file-storage-module-files`, `features-to-buttons-arrays`, `buttons-arrays-to-buttons`, `widgets-to-logotypes` and `logotypes-to-file-storage-module-files`.

### Resolved P2 — the catalog owner association lacked durable capture registration

The new `public.rc_ws_to_em_me_ws_c76` table originally had its generated relation migration but no entry in the provider capture catalog or capture SQL. Applying only that relation migration left its owner-link changes outside durable generation/outbox capture. The reader's correct ID filter did not replace that missing mutation coverage.

Root generated the provider artifacts through the repository generator and reported applying its migrator. Source reread confirms the new resource in `libs/providers/db/src/lib/drizzle/migrations/capture.json:188` and the matching topic/columns install in generated `0008_consistency-capture.sql:66`, including the generator's row and TRUNCATE capture setup. This resolves the source omission. This reviewer did not query the database or reproduce warmed-cache/reconnect behavior.

### Accepted source behavior

The publication tool uses the existing SDK adapter and cutover engine, explicit localhost origin, exact selectors, protected collection snapshots, server-returned IDs, persisted progress and version checks. Consumer switches follow additive preparation. The protected collections are checked before writes, at existing switches and at final verification. Rollback retains additive records and explicitly retained security configuration; the command does not call checkout, fulfillment or token grants. The exclusive-maintenance flag is documented as an operator precondition, not an HTTP transaction or job-disabling mechanism.

The new catalog relation points down the confirmed module order from RBAC to Ecommerce. Its schema has explicit owner/target foreign keys and a generated unique pair; API, SDK, admin and migration targets exist. The catalog reader selects one exact owner link, orders only its Product memberships, queries only those Product IDs and preserves Subject purchase actions. Missing or ambiguous ownership, empty curation and missing referenced Products do not trigger a fallback to every Product.

Both `hidden` relation variants return null without loading a target, and their public literal registries and props unions contain the discriminator. They preserve the saved association while suppressing its public presentation. The reviewed Website Builder views retain SDK relation reads and do not import RBAC, Host business state or Studio implementations.

### Validation still pending

Root's focused publication-tool evidence is five Bun tests and 20 assertions passing in about 0.7 seconds. This reviewer read those cases; no duplicate execution was requested. They establish the in-memory adapter cases they exercise, including ID remapping, unknown create recovery, drift refusal, repeat/fresh preparation and bounded rollback.

No build, TypeScript project check, Nx task, server, watcher, test suite or CMS mutation was started by this reviewer. Generated migration provenance/application, deployed row/TRUNCATE triggers, warmed owner-association reads plus another client, real SDK prepare/apply/repeat/rollback, RSC serialization, desktop/mobile shell visuals and reader counts still require their planned acceptance evidence. Those gaps do not establish additional implementation bugs. This scoped review does not accept the whole UI or advance the issue status.

### Loaded-record correction and Category curation — independent source re-review

The loaded-record finding is **resolved in source**. The fourteen bounded Website Builder files now pass `dataSource="props"` at every reviewed loaded relation-row and target-model handoff. Their keys use the record ID. The collection `find` readers remain responsible for the current result, ordering and subscriptions; the shared props-mode path renders that result without another reader or Provider. This reread covered the six composition files and eight default relation renderers listed above. It did not measure transport counts.

The additional Category correction is also accepted in source. Ecommerce Widget `category/list-default/Component.tsx` now reads only `WidgetsToCategories` links filtered by its own Widget ID, orders them by `orderIndex` and ID, and renders each loaded association in props mode. The default association renderer selects its exact `categoryId` and renders the loaded Category in props mode. Empty curation has an explicit empty state and never reads every Category. An unrelated saved Category therefore does not enter this Widget merely by existing in the database.

No established implementation finding remains open in this independently reviewed publication/catalog/Website Builder shell scope. This is a **source review PASS for that scope**. The validation gaps above remain pending. The review excludes the reviewer's own account, editor, author/feed consumers, `content-form`, and new `content-collection` frame; their corrections require a different reviewer and their normal checks. No status transition or whole-task approval is implied.

## Recovery R2.1 actual PostgreSQL and Hono evidence

`apps/api/specs/integration/account-publication.integration.spec.ts` passed as one serial scenario in 5.574 seconds, with the test itself taking 5.266 seconds. This final run includes the warmed public-author checks and root's legacy-cache correction. The coordinated command was:

```sh
NODE_OPTIONS=--max-old-space-size=1536 node node_modules/jest/bin/jest.js --runInBand --config apps/api/jest.integration.config.ts --runTestsByPath apps/api/specs/integration/account-publication.integration.spec.ts
```

The Bun child loads the effective owning module Services and controllers without importing `apps/api/app.ts`, starting jobs, or contacting a payment, notification, identity or AI provider. Its real SDK loopback requests resolve to the isolated Hono assembly. PostgreSQL and Redis are the existing local services. Fixtures commit so concurrent operations acquire locks in separate actual transactions; repositories and transaction callbacks are not mocked.

The passing assertions establish:

- Concurrent registered-human Profile ensures return one personal Profile and ownership link. Repeated ensure preserves that ID. An existing linked Telegram Profile retains its ID and slug. An SQL failure after an actual Profile insert rolls the transaction back before retry.
- Concurrent matching Article requests return one Article with exactly one Subject owner, Social author and Category association. Two different owners racing one request UUID produce one success and one conflict. Changed retries, a foreign owner, an Identity-less guest, an agent Subject and forged author input are denied. Foreign-owner middleware retains its existing HTTP 401 convention; guest/agent publishing returns 403.
- Exceptions after each actual Article, Subject-owner, Social-author and Category insert roll back the complete Article graph. Retrying each failed request creates one complete graph.
- Public author list/count/detail include a published human and ownerless editorial Profile, exclude an unpublished Profile and AI Profile, and omit Subject/Identity identifiers, private slugs, admin fields and MCP configuration. A historical Message author and Action actor with no current Chat membership or public publication still have a scoped display/avatar DTO. An outsider's scoped Chat requests are denied. Avatar projection uses fixture File metadata; image-byte delivery is not tested here.
- Both real Redis response-cache implementations store and serve their immutable controls. Raw Profile list/count/detail, uppercase UUID, braced UUID and compact UUID shapes permit operator and explicitly bound administrator GET/HEAD requests, then deny anonymous, guest and ordinary-account requests. Raw requests perform no response-cache lookup or storage. Deleting the fixture administrative binding through the owning repository denies the next administrator read in both modes. This last assertion covers persisted binding revocation, not `app.ts` payment-entitlement revocation effects.
- Empty public author list/count/detail queries record their actual candidate Profile-to-Article dependency in a persisted consistency query, and that table has an enabled deployed capture trigger. The consistency cache actually stores and serves all three empty responses; an execution counter and `X-SPS-Cache: hit` distinguish hits from fresh reads. A real Article POST advances their captured PostgreSQL generations and all three requests return the new author. Deleting its last public author association returns an empty list, zero count and null detail. Legacy mode executes these author readers on every request after its bounded exclusion, while its separate immutable control still proves that the legacy cache is enabled. Publication and association removal return fresh values in that mode too. The test never clears or manually invalidates a cache between warming and verification and never starts a dispatcher against the shared outbox.

Every ID inserted by the fixture process is removed in `finally`, including IDs from failed transactions. The suite verifies their absence and unchanged hashes for thirteen pre-existing Subject/Identity/Role/Permission/Profile/Article and association collections. Redis keys and query references use an isolated namespace and are cleaned. Earlier fixture-only runs corrected the failure injection, the existing 401 status expectation and the repository deletion method; their cleanup comparisons also passed. No runtime source was changed by this test agent.

The expanded check reproduced a stale legacy author list, count and detail after the first committed publication: the cache retained the earlier empty results although PostgreSQL capture generations advanced. Root corrected the canonical legacy exclusion in `libs/middlewares/src/lib/http-cache/routes/singlepage.ts` for the named author aggregate. The final passing run verifies that fresh-reader behavior and leaves the consistency cache active for the same aggregate. This resolves that reproduced legacy-cache finding within the three named author operations; it does not establish other aggregate cache behavior.

This evidence does not cover email/OAuth/Telegram provider transport, full registration delivery, Free/token fulfillment, browser rendering, production Host behavior, public author Profile/media edits, or second-browser realtime reconciliation. Those remain separate acceptance checks. The passing scenario does not advance the workflow status or replace an independent source review.

## Independent review — Blog/Social Widget presentation relations

Verdict: **source PASS after correction**. This reviewer did not author the two new `widgets-to-website-builder-module-widgets` packages. Scope: Blog/Social schemas and generated migrations, ordinary API/SDK layers, default/find renderers, Widget admin/admin-v2 forms and module registrations, project migration targets, and generated provider capture 0009. No database command, type checker, build, test or browser was run for this review.

The initial source finding was a missing deployment path: both packages had leaf `repository-generate` and `repository-migrate` targets, while their module `relations:repository-generate` and `relations:repository-migrate` aggregates omitted the new relation. Normal API-wide migration would skip its table. Root corrected all four aggregate lists; a source reread confirms the exact targets are present. This finding is resolved.

Both schemas reference their own Widget and the lower Website Builder Widget, use a unique owner/target pair, and cascade each foreign key. Multiple ordered links remain legal. Generated SQL matches those constraints. Each ordinary default renderer reads its exact linked Website Builder ID, selects the saved variant with props mode, and forwards locale, children and footer JSX. The relation contains no business-screen selection or copy override. Public literal registries and effective props unions contain the variants; admin forms expose scoped owning links. Reviewed imports follow the confirmed module order.

Capture catalog and generated 0009 SQL contain both tables, semantic topics and UUID column mappings. The fresh-database sequence is coherent in source: provider installation registers each resource before checking table existence; the shared MigrateConfig installs row and TRUNCATE triggers after each leaf's table migration, retaining the catalog topic. The provider-first API migration order therefore needs no extra hook. Root reports applying the generated migrations and capture locally; this reviewer did not inspect deployed triggers.

The isolated-schema PostgreSQL tests exercise generated SQL, missing references, unique pairs, multiple links, ordering/defaults and both cascades, with transaction cleanup. They were read but not run by this reviewer. Actual constraints/triggers, API authorization, warmed reads and second-client invalidation remain runtime checks.

## Independent review — concrete public data cutover

Verdict: **source/domain PASS for the concrete 169-target input**. Reviewed `ISSUE-376-platform-confirmed-input.json` (SHA-256 `491a808ba06d51cef21885658d68f7091df4cb7031c8457a98b94fc4c25d2e56`) against private prepared `.git/sps-runtime/issue-376/platform-before-v2.json`. The initial before manifest is retained separately. Protected record contents and Store credentials are excluded from this report.

The prepared input exactly matches the public input. All 169 targets resolve to the prepared operations with matching selector, data, switch and rollback-retention flags: 27 explicitly identified existing records and 142 new records. All 237 references resolve to earlier targets; literal foreign keys have UUID syntax. The 29 protected selections contain 576 observed rows. No operation targets one of those protected rows. The reviewed target set contains no Order, Invoice, Payment Intent, balance, Role membership, Store or Pro/Free commercial-attribute mutation.

The six exact public GET policies and three raw-Profile admin bindings are absent in the before manifest and become new records, with retention on rollback. Their input does not replace an existing policy or add a roleless write grant. Root separately checked live route/method and Role bindings through SDK before preparation; this source review does not repeat that live check. Visual rollback retains these security classifications as specified.

About replaces its own Page-to-Widget association and adds its own content graph. It does not overwrite the shared Blog Widget for About or target the protected private Website Builder graph. Author/detail/feed frames use their exact owning links. The public Store section is hidden through its Page association; Store/key records and Store-to-Order links remain protected. The catalog creates Landing USD 100 and Startup from USD 2000 through new Product/price records; existing paid Products and their attribute links are protected.

For all six Articles in both locales, codeBlock nodes and every top-level content node before the final source list are unchanged. All 39 source paths match the source map: 29 blob links and 10 tree links with the local-file label. Repository/ref/URL shapes match the manifest. Covers, author/category links and private subscription associations are not targets. This comparison establishes preservation and mapping; it does not independently establish remote GitHub availability.

No established source blocker remains for this concrete public cutover. Root owns its application and live acceptance. Actual SDK referents, drift checks at apply, server-returned IDs, readback, repeat-zero-writes, rollback, route resolution, cache behavior and rendered output still need runtime evidence. AI Chat navigation uses `/`, the existing site root; its live destination remains part of the route check. This acceptance does not include the separate pending Pro price/period and token-pack commercial cutover.

## Independent UI correction review — editor and collection Widgets

Verdict: **source PASS for the previously reported UI findings**. This reviewer did not author the editor, three collection Widget shells or `content-collection` frame.

The Article editor now requires a nonblank current-locale Summary in runtime and Studio. A definite 4xx rejection exposes Edit draft, preserving field values and clearing the submitted attempt/request UUID only after that explicit action. An unknown transport result, timeout, throttling or server error retains the immutable attempt for the same-request retry. The shared responsePipe carries a numeric HTTP status into the client error, so the actual SDK response can select the correction path. The focused editor test source covers rejected-category correction with a new UUID, uncertain retry reuse and blank Summary; it was not run for this source review.

Social author list/detail and Blog feed now compose their exact owning Widget-to-Website Builder relations. Loaded links render through default in props mode, with functional rows and pagination supplied as children/footer JSX. The Website Builder `content-collection` owns saved heading, TipTap description and collection grid. Its literal runtime/Studio registries, public props and SDK variant list are registered. The prior Host provider correction remains source-accepted: generic Host dispatch preserves the public server views while the owning feed consumes client render ports.

The original Widget ownership finding, editor lock finding and Summary mismatch are resolved in source. No further established defect was found in these bounded corrections. Production types/RSC serialization, actual saved frame selection, browser/keyboard/320px layout, definitive rejection and unknown-result retry through HTTP, first publication and feed/byline/menu refresh remain runtime gates. This review does not accept this reviewer's backend implementation or advance the issue status.

## Recovery independent review — account, public authors, scoped Chat and fulfillment backend

Revision: local working changes over `3e6447dbf9fbd90b380ab771684a68dadc7d2d7c`. This reviewer did not implement the backend under review. Scope: API raw-Profile/cache placement; Subject DI, repository transaction helpers, Article command/controller/SDK and personal Profile ownership; Social author DTO/Service/controller/SDK; authorized Chat participant/sender/actor projections; trusted Free graph creation and ordinary paid-credit fulfillment. The review uses the approved Round 2 plan, the current source, and the recorded focused unit and actual PostgreSQL/HTTP-cache results. It does not approve this reviewer's frontend implementation.

Verdict: **source review PASS after the two corrections below**. No other actionable implementation defect was established in this scope. The existing Free lifecycle documentation still needs the correction noted below. User-facing runtime and commercial acceptance remain separate.

### Resolved P2 — new Free writes bypassed effective lower Services

The initial Subject bootstrap bound generic CRUD wrappers directly to foreign Billing and Ecommerce repositories. The new Free flow activated create/update through those bindings for its Invoice, PaymentIntent and association graph. That bypassed the lower model/relation Service and its startup selection at a newly used write entrypoint. This was a confirmed ownership-contract defect; no incorrect financial amount was reproduced from the currently empty lower CRUD overrides.

Current `rbac/models/subject/backend/app/api/src/lib/bootstrap.ts` binds the affected Billing capabilities and Ecommerce Store/Store-Order/Order-Currency/Order-Intent capabilities to their effective foreign `app.controller.service` instances. The lower Order/Product operations keep their effective Service construction. Existing ambient repository transaction propagation remains in place; the correction adds no loopback HTTP to the atomic Free graph.

### Resolved P2 — legacy caching retained empty public-author aggregates

With `MIDDLEWARE_HTTP_CACHE=true`, consistency mode `off`, and an ordinary HTTP request without `X-SPS-Consistency`, the new Author list/count/detail routes were stored by the legacy cache. Their route-derived topic was `social.authors`, while their source mutations emit Profile, Article, Product and association topics. A warmed empty answer could survive the first public Article publication. The new SDK's consistency header bypassed this legacy path and therefore did not prove that ordinary HTTP readers were correct.

The API proof worker reproduced stale empty responses for all three named reads. Current `libs/middlewares/src/lib/http-cache/routes/singlepage.ts` excludes exact public Author GET/HEAD shapes. The final proof confirms fresh legacy aggregate readers without response storage and retains an independent actual cache-hit control. Consistency mode still stores and hits the aggregates, records their real source dependencies, and rejects the cached generation after Article creation or author-association deletion. This correction preserves consistency caching rather than replacing that proof with no-store reads.

### Reviewed principal and transaction boundaries

- The exact Article POST delegates to matching-JWT controller middleware even when an operator secret is present. Its Service also requires a persisted default human Subject with an Identity. Payload parsing rejects client-selected owner/Profile/variant/slug/ID fields, normalizes paired EN/RU title/body maps, and bounds rich text, nodes, marks, links and payload size. Code blocks remain optional.
- Personal Profile creation uses the common Subject transaction lock, reuses the existing default/Telegram ownership relation independently of private slug changes, rejects foreign/ambiguous personal ownership, and keeps assistant grants distinct. Article creation calls this capability inside its own common transaction, then writes Article, Subject ownership, Profile authorship and optional Category links atomically. Durable request UUID slug plus normalized payload and exact links govern replay; foreign collisions fail without returning the other Article.
- The repository's transaction-scoped database context reaches the effective child Services without mutating a shared repository handle. Subject locks precede Order locks. Top-level trusted Free rejects an ambient outer database transaction, returns fulfillment effects from its own committed transaction, and dispatches notifications after commit. Its internal paid-fulfillment capability remains available to an explicit transaction owner.
- Public Author reads accept only named UUID filters and bounded pagination, apply the same eligibility to list/count, and use a repeatable-read snapshot for aggregate assembly. Their DTO allowlist contains public Profile text/avatar data and explicit public Article/Product references, excluding private Profile slug, adminTitle, Subject/Identity ownership, MCP configuration and private workspace collections. The public controller does not expose the private `profilePresentation` capability or its administrative display-title fallback.
- Raw Profile protection runs before both response caches and checks current Role assignments and explicit administrative Permission bindings. Named public Authors and already scoped nested routes remain distinct. Scoped Chat enrichment selects IDs only from authorized Chat participants, selected Messages or Actions; departed senders can receive display badges without becoming public authors. Existing full participant records remain available to authorized member/admin operations.
- Trusted Free rejects self-service cart and quick-checkout acquisition, resumes its exact zero-price graph, and checks once-only owned history under the same lock as ordinary delivery. Its accepted period/Invoice transition and exact 3000 Token credit commit together. Paid fulfillment validates positive quantity/amount, aggregates by Currency, credits only an accepted paid Order/Invoice transition, and does not suppress a second paid Order merely because the Product is already delivering. Paid referral behavior remains outside the exact Free allowance path as specified by the plan. Free renewal and blanket wallet clearing are absent; expiry/revocation still govern access independently of retained balances.

### Evidence and remaining limits

Recorded focused unit results remain four suites/32 cases for Article payload/ownership/raw access, and three suites/63 cases for Free/Telegram/Proceed. The recorded real fulfillment integration run passed both suites and all six PostgreSQL cases. That fixture uses real transaction, settlement, grant, period and wallet writes; its Product/Currency attribute projection is fixture configuration rather than the saved commercial graph.

The final `apps/api/specs/integration/account-publication.integration.spec.ts` run passed one suite/scenario in 5.574 seconds with the current DI/cache corrections. Its isolated Hono assembly uses effective Services, real PostgreSQL and Redis, and independent concurrent transactions. It proves personal/Telegram Profile reuse; Profile and Article graph rollback; replay/collision and guest/agent denial; public DTO filtering; warm list/count/detail generation behavior; raw GET/HEAD aliases and persisted administrative-binding revocation; historical scoped Chat presentations and outsider denial. Fixture cleanup and thirteen existing collection hashes passed. SDK loopback resolves only to that isolated Hono assembly. The worker's permanent result above records the exact command and assertions.

No test, type checker, build, server or CMS mutation was started by this reviewer. Root reports the API type check retains twenty known baseline diagnostics with no new diagnostics; that is not a clean type-check pass. The isolated proof does not execute `apps/api/app.ts` jobs or real registration/payment-provider transports, confirm a browser/second client's realtime behavior, or inspect avatar bytes. Production Host rendering, browser session transitions, final requested dev-process startup, saved-graph cutover/recovery and pending Pro/pack commercial input remain acceptance work.

Documentation correction: `libs/modules/rbac/README.md:204–212` still describes daily Free renewal resetting the wallet to 3000. The implemented lifecycle grants Free once and retains additive credits. Update that operator-facing setup/lifecycle description before final handoff; this mismatch is separate from the two resolved source defects.

## Recovery local publication

The reviewed confirmed input applied through the maintained SDK flow: 142 additive records and 27 exact existing updates. Verify passed; repeated apply skipped all 169 operations; a fresh prepare returned zero operations. Rollback restored the existing presentation associations while retaining additive records and security configuration. A new prepare then found 27 updates, and reapply performed zero creates and 27 updates; final verification passed. All 29 protected selections cover 576 rows, including financial records and the closed Widget graph. Private manifests are under .git/sps-runtime/issue-376, mode 0600; they are not Git artifacts.

The canonical shell File has ID 3881123d-548a-40c2-b46f-92a5bb620118; its 1739 bytes exactly match operator-logo-square-white.svg. Contact resolves to the existing CRM presentation anchor contact. Six exact public GET policies and three raw-Profile administrative bindings were fresh-read before application and retain protection through visual rollback. Pro price/period/pack application is excluded from this manifest; the period remains unanswered.

The editor regression suite passes all six tests (1.368s): definite rejection permits explicit editing with preserved draft/new request ID; unknown/408/429/500 retries keep the immutable original payload; blank Summary cannot publish. Two real PostgreSQL relation-constraint suites also pass; their precise commands and cleanup are in ISSUE-376-widget-presentation-relations.md.

## Independent source review — optional Host Turbopack memory target

Verdict: **source PASS for the bounded configuration** in `apps/host/next.config.js`. `SPS_HOST_TURBOPACK_MEMORY_MB` is optional and accepts positive safe integers. The conversion from MiB to bytes matches installed Next 15.4.8's `experimental.turbopackMemoryLimit` contract (`config-shared.d.ts:365`). A value of 1024 supplies 1,073,741,824 bytes. The installed dev hot reloader forwards the option as native project `memoryLimit`; Host's dev target selects Turbopack. The launcher retains the supplied Node heap option and adds only its existing WebStorage safeguard.

This is a Turbopack target, not a hard limit on process RSS or a replacement for Node's V8 heap cap. No automatic heap increase or restart is added. The runtime README paragraph was still pending when this review read it; it should preserve that distinction and the unset behavior. No compiler, server, test or browser was started for this review. Initial-request compilation and machine memory behavior remain runtime evidence owned by root.

Final Host TypeScript before dev startup: exit 0 with a 3072 MiB heap and no diagnostics. Webpack dev then failed within its separate 3072 MiB heap on first page compilation; default Turbo dev with a 1024 MiB native target and 1536 MiB Node heap is under HTTP verification. Browser reload of the old internal connection-error document was rejected by browser policy; no retry or alternate browser surface was used. Manual opening of the actual localhost URL was requested.

## Earlier dev HTTP verification — 2026-10-24

API runs through npm run api:dev; Host runs through npm run host:dev with Node heap1536 MiB and the optional native Turbo target1024 MiB. The misplaced client directive and missing curated Category read policy were fixed before this matrix. All15 inspected EN/RU Host responses are200 with no Permission error, Internal Server Error, NEXT_HTTP_ERROR_FALLBACK, private marker or private Widget ID. This verifies server response content, not hydration, clicks or mobile layout.

- `/en/framework`: HTTP200, errors [], 1.49s.
- `/ru/framework`: HTTP200, errors [], 1.16s.
- `/en/about`: HTTP200, errors [], 1.36s.
- `/ru/about`: HTTP200, errors [], 1.18s.
- `/en/blog`: HTTP200, errors [], 1.33s.
- `/ru/blog`: HTTP200, errors [], 1.02s.
- `/en/authors`: HTTP200, errors [], 0.9s.
- `/ru/authors`: HTTP200, errors [], 0.85s.
- `/en/authors/f11415c5-ea50-4c08-b5c9-ca404eb8b835`: HTTP200, errors [], 1.27s.
- `/en/blog/new`: HTTP200, errors [], 0.92s.
- `/ru/blog/new`: HTTP200, errors [], 0.96s.
- `/en/ecommerce`: HTTP200, errors [], 0.93s.
- `/ru/ecommerce`: HTTP200, errors [], 0.91s.
- `/en/blog/articles/nextjs-server-client-readers-and-widget-slots`: HTTP200, errors [], 0.97s.
- `/ru/blog/articles/framework-private-content-audit`: HTTP200, errors [], 0.92s.

Actual public author list/count/detail API reads are200 with one eligible editorial Profile; the summary keys are articleCount,avatar,description,id,productCount,subtitle,title. Anonymous raw Profile list/count are403; all three newly used Widget owner associations return200.

Browser automation remains blocked: the reload of the old connection-error document was rejected by URL policy; after the user reported manually opening the actual page, automatic approval review also rejected observing that tab as a retry. No alternate browser or indirect UI observation was used. Explicit browser approval is pending. The user has separately been asked for the missing Pro billing period.

## Historical recovery verification — before commercial application, 2026-10-24

Pro terms are confirmed: 29 USD or 1900 RUB per month for 5000 tokens. The separate commercial input preserves the 0.13 RUB/token top-up rate and 100/300/500/1000/3000 RUB prices. Preparation is read-only; application waits for the legacy Order reader correction and independent review. Earlier pending-period notes describe the preceding checkpoint.

Scoped ESLint for all 524 changed TypeScript/TSX files passes after replacing two test-only require calls and formatting that file. Studio TypeScript passes after the public-story corrections. Code placement passes; the final module-order audit covers 15,204 source files with zero violations. Studio design-system and Workspace validators pass. The complete Studio/Workspace presentation test command passes 380 tests in 40 files, 29,024 assertions, 10.88 seconds; a prior sandbox-only listener failure was rerun with local networking enabled. Figma metadata records null node IDs and not-created state, not created designs.

Actual consistency diagnostics show all 158 resources covered, lagMs 0 and degraded false. This supersedes the earlier transient timeout observation; no manual global-outbox reset or tick was used.

The browser now permits the explicitly authorized localhost inspection. Reload removes the old Category permission error. Desktop checks confirm the canonical logo and menu, gallery Next 1→2, guest cart add/read total100USD/remove (test line removed), category cover→Frontend, Article cover→Next.js Article, five rendered GitHub source links, Author directory and editorial Profile with six Articles/two projects. The guest private Article renders its public body and subscription gate without the protected marker. Its old sign-in and catalog CTA destinations are corrected to the actual singular Subject sign-in and Ecommerce routes; the sign-in transition succeeds. No payment or CRM submission occurred.

Responsive capability was explicitly authorized for320px, but this browser reports an actual400px CSS viewport. At that actual width, Author layout fits; mobile menu opens, Escape closes it and focus returns to Open menu. The viewport override is reset. Exact320px and authenticated browser session transitions are not proved by this observation. Screenshot: /tmp/issue376-private-gate.jpg (guest gate and grouped footer). Production build is running separately at3072MiB Node heap with one worker; no result is claimed yet.

## Thermal checkpoint and client-boundary audit

The production Webpack phase compiled successfully in88seconds. Root terminated its Next build and type-check worker after the user reported heating; the command ends143/SIGTERM and is not a production-build PASS. No completed build was started. Current Host is stopped; API remains available on4000. System memory free was about60% after the stop, and the user confirmed noticeably reduced heating. The CPU snapshot also showed VSCode Tailwind/Nx and system cleanup activity; no causal attribution to any source import is established.

The bounded RBAC source audit covers5466 unique project files across its six named roots, with76 explicit server-action boundaries and zero remaining unsafe Node/server-only candidates. Its report states external, dynamic-import, type-graph and bundle limitations. A separate Social/Blog source audit found no established Node/DB implementation leak or polling cycle. A concrete new Blog Provider→broad public barrel→admin→Widget/feed import cycle was found and removed using `@sps/blog/frontend/component/provider` mapped to the existing client provider; both consumers use that entry and the new broad reexports are removed. Independent source review accepts this correction. Server-rendered JSX children and client-created callbacks retain their distinct boundaries. No new whole-build or thermal performance claim follows from the source audit.

The independent source reviewer also found the empty curated Popular Widget falling back to all Articles. Its linked membership query now renders empty on an empty selection. This and the corrected private Article actions have source acceptance; runtime regression checks after these final changes remain held.

## Historical root acceptance after the source checkpoint

Local commit `18f454fef1` contains the implementation and bounded client-boundary correction; hooks performed formatting only, and its actual downstream trailers validate. No push or PR was created.

The serial Order regression command passed all45 tests in3 suites in1.982seconds, with Node heap1536MiB. It covers saved Invoice/interval projection, retired-currency checkout rejection and fixed subscription periods, including the independent cross-currency correction. The attempted nice adjustment was unavailable in the sandbox; the test process completed and exited.

Actual SDK reads succeed for all7 existing Pro Orders before and after the price change. Their type/status classification still matches the zero-candidate legacy-freeze observation. A fresh protected preparation matches all84 independently reviewed selections/669 rows exactly. No fixed period needed freezing; inactive paid and OPEN cancellation histories gained no entitlement.

Commercial publication through the maintained local SDK tool:70 additive records and6 existing updates; verify passed. Repeat skipped76 operations with zero writes; fresh preparation required0 operations. Rollback restored6 existing configuration records while retaining additive records, then a fresh prepare found6 updates. Reapply performed0 creates/6 updates and verification passed. Final terms are Pro29USD or1900RUB per month for5000 tokens, five RUB top-ups at the existing0.13RUB/token rate, and the two service examples. Financial observations, original Product/Attribute records and the protected Article graph are unchanged. No checkout, payment, token grant or notification was performed by publication. Private receipts remain mode0600 under `.git/sps-runtime/issue-376`.

Host and full production acceptance remain held after the thermal report. API continues on4000 through `npm run api:dev`. Exact320px, complete authenticated browser transitions, post-checkpoint Host compilation and a completed production build remain open. The issue remains In Dev; these results do not claim final Code Review readiness.

## Resumed dev verification, 2026-10-24

The user authorized restarting Host and continuing to Code Review. The exact
`npm run host:dev` command runs with Node heap1536MiB, Turbopack memory target
1024MiB, Nx daemon/plugin isolation/cache disabled and the separate
`.next-issue376-recovery-turbo` directory. Ready took5.8seconds; the first
Framework compilation/request returned200 in84.23seconds. A serial warm matrix
of15 EN/RU Framework, About, Blog, Authors, editor, Ecommerce and Article routes
returned200 in0.88–1.94seconds per request, without Next error markers or the
protected Article marker/Widget ID. Exact route results are in
`/tmp/issue376-current-dev-http.json`. This proves the current dev rendering,
not a production build.

The numeric Token attribute correction has independent source/manifest PASS.
Its maintained SDK application created one numeric Key and changed only the
Key reference in six existing managed associations. Verify passed; repeat
skipped7 operations with0 writes; fresh preparation returned0 operations.
All84 protected selections matched. Full input now contains77 targets; the
bounded correction has7. Source, hashes and private receipt paths are recorded
in `ISSUE-376-commercial-topup-key-review.md`. UI readback is recorded separately
by the browser reviewer.

Disk preflight found1.6GiB available before the next build. Root removed one
generated Host Nx cache entry, `10454412573202851796`, dated19October; its
generated contents occupied7.8GiB. No application source or saved content was
removed. Available space then measured7.4GiB. The current dev output and
private data receipts remain available.

## Completed production target and built Host verification

The resumed Next/Nx build completed compilation in4.2minutes, type validity,
static generation8/8, optimization, traces and the final route table. Nx reports
`Successfully ran target next:build for project host`. Fresh build ID:
`MKpFtIHdiJJQqecTuXDQO`; app/page/prerender manifests exist. The builder PIDs
75725,75762,75763,77914 are gone. The independent final reviewer accepts this
as a completed Next/Nx build.

The temporary CPU supervisor ended with exit1 after a PermissionError signalling
the already-exited process group. It did not save its final resource receipt;
its outer exit is not0. Recorded samples reached2803.1MiB at elapsed516.7seconds;
they do not establish the complete run's maximum. The supervisor now checks the
child's exit after a signalling race. No repeat compiler run is needed solely
for that bookkeeping error. Raw log:
`/tmp/issue376-production-resume-build.log`; explicit observation/limitation:
`/tmp/issue376-production-build-observation.json`.

During the built verification, `npm run host:start` served that exact output
on3000, PID78267, Ready448ms,
Node heap1536MiB. A serial matrix requests18 EN/RU Framework, About, Blog,
Authors, editor, Ecommerce, Category and Article paths twice. All36 first/repeat
requests return200 without Next error markers, DYNAMIC_SERVER_USAGE, the private
Article marker or protected Widget ID. Maximum observed request time0.826s.
Receipt: `/tmp/issue376-built-http.json`. An initial Python attempt had no local
socket permission in the sandbox; the matrix above is its permitted retry.

## Historical first registration attempt — before guard correction

The normal API was stopped for the reviewed temporary full-app harness on4000.
Only new fixture Orders' outbound paid notifications are replaced. The two
Telegram diagnostic-delivery variables are empty in that process; console logs,
auth, RBAC, DB, fulfillment and ordinary business notifications remain active.
Normal environment files are unchanged. A startup flag collision with bcrypt's
node-pre-gyp was corrected by using `--fixture-state-dir`. Before retry, every
captured baseline row matched exactly, no fixture ID existed and the failed
process was gone; prepared credentials were preserved.

The first real registration reaches the actual Identity action and fails403
before creating a row. The private-content mutation guard interprets
`/api/rbac/identities/email-and-password` as a UUID detail route, then the owning
lookup raises PostgreSQL22P02. The guard's fail-closed wrapper returns403.
This is a backend classification defect, not a missing guest permission or a
client/server import error. Its correction, independent reread, focused tests
and a new real registration remain required before authenticated acceptance.

## Completed registration, browser and cleanup evidence

The narrow named-action correction has independent source PASS in
`ISSUE-376-final-source-review.md`. Only normalized 32-hex UUID record IDs reach
the WriteAccess record lookup; named Identity actions still parse the cloned request and
run private-reference protection. Bulk processing, find-or-create body checks,
transaction/graph locks, private CRUD and encoded/braced/hyphenless read handling
remain. The focused Hono fixture uses a real Graph/WriteAccess and a JSON echo
handler; real multipart registration is covered separately below.

```sh
NODE_OPTIONS=--max-old-space-size=1536 node node_modules/jest/bin/jest.js --config libs/modules/rbac/jest.config.ts --runInBand --runTestsByPath libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/access.spec.ts
NODE_OPTIONS=--max-old-space-size=1536 node node_modules/jest/bin/jest.js --config apps/api/jest.integration.config.ts --runInBand --runTestsByPath apps/api/specs/integration/private-content.integration.spec.ts
```

Root's serial results:20/20 access tests in 1.401 s and the actual private
PostgreSQL/Hono/Redis/cache/bytes matrix 1/1 in 22.233 s. Six final changed files
pass scoped ESLint. These commands did not run concurrently with a compiler.

The reviewed temporary full-app API harness then accepts real fixture
registrations. B receives 201. A's Identity/Profile/Free transaction commits,
then a mismatched temporary global Hono JWT resolver returns 500. The harness
uses canonical verifyJwt/project adapter after correction; A's normal browser
login succeeds. Both persisted fixture graphs contain one human Identity,
one personal Profile, one initial Free Order, one paid zero Invoice and a 3000
Token balance. A's initial response is preserved as 500 in the evidence.
The receipt records four suppressed fixture notifications, not real external
delivery. The normal app environment files are unchanged.

Identical Article request UUID/payload returns the same Article and unchanged
owner/author/category graph. B's collision returns 409 and A targeting Subject B
returns 401. The built-browser addendum independently observes publication,
feed card, UUID portfolio/byline and the new My author page menu. Three unique
unsaved draft values disappear after A logout; B's three editor fields are
empty, guest editor inputs are absent and B's private gate contains neither
hidden marker nor Widget ID. Chrome error logs are empty for this pass.

The temporary API exits through awaited USR2 teardown, and normal API/Host dev
commands are restored. Cleanup removes 92 recorded IDs with zero baseline drift
and exact preservation of captured nonfixture hashes. A read-only repeatable-
read review inspects 12 Subject FK columns: both fixture Subjects are absent;
four remaining default Subjects have zero references and are preserved as
ordinary orphan guest records with unassigned provenance. No ownership evidence
supports deleting them. The old registration receipt's fixturesCleaned=false
is a pre-cleanup observation; the final cleanup receipt records the current
state. Post-cleanup commercial prepare has 0 operations and 84 protected selections.

Current receipts:

- `/tmp/issue376-production-resume-build.log` and `/tmp/issue376-production-build-observation.json`: completed target and separate supervisor limitation.
- `/tmp/issue376-built-http.json`:36 first/repeat built HTTP responses.
- `/tmp/issue376-auth-registration-proof.json` and `/tmp/issue376-auth-replay-proof.json`: actual registration state and replay/isolation.
- `/tmp/issue376-final-cleanup-proof.json` and `/tmp/issue376-fixture-cleanup-review.json`: cleanup and preserved orphan classification.
- `/tmp/issue376-final-api-readiness.json`, `/tmp/issue376-final-consistency-status.json` and `/tmp/issue376-final-dev-readiness.json`: public API, authenticated diagnostics and final dev responses.
- `/tmp/issue376-final-category-css-proof.json`: generated explicit 16/9 rule; mobile frame 272 × 153/computed 16/9 also passes.

The completed production build predates only the two Category Tailwind frame
changes (`aspect-[16/9]` and absolute child). Their narrow source and generated
CSS evidence pass; desktop geometry is 16:9. Actual 320 px verification passes: frame 272 × 153, computed 16/9, inner/client/scroll
widths 320, absolute child and cover. Console error list is empty; viewport and
original 80% zoom are restored and the QA tab is closed. Multiple/no-media Studio
cases remain source fixtures only; no extra Studio compiler was started. The
independent final verdict by code_review_readiness is PASS for human Code
Review. Commit `e39747ae4e` and GitHub status Code Review are verified. No production recompilation
is claimed for those final class-only edits.

## Verified Code Review handoff

Implementation/acceptance commit: `e39747ae4e`; branch:
`codex/issue-376-framework-visual`. GitHub Project update and subsequent status
read both confirm **Code Review**. The [issue summary](https://github.com/singlepagestartup/singlepagestartup/issues/376#issuecomment-6376141035)
contains the checks and their limits. Normal API/Host dev servers remain on
4000/3000. Human Code Review is pending; no PR, push, merge or Done transition.
