# ISSUE-376: independent final acceptance review

Revision: `922d823da6`, including implementation `18f454fef1`, compared with
approved-plan checkpoint `3e6447dbf9`, plus the four Category presentation files,
the named Identity mutation-lookup correction and its regression, and the
reviewed numeric Token Key manifests. Branch:
`codex/issue-376-framework-visual`. Host's temporary generated TypeScript include
changes are restored and are outside the application-source verdict.

**Final verdict: PASS for handoff to the user's Code Review within the evidence
and limits below.** No unresolved confirmed finding remains in the reviewed
scope. This reviewer did not author the implementation, change application
source or saved data, start a server, run tests or compilers, use the browser,
or change the issue status. Final human Code Review remains the user's step.

## Reviewed evidence and source

The review applies `review-pr`, the approved Round 2 plan, the frontend,
module-dependency and code-placement contracts, and the issue's incident log.
Its starting evidence is the final source review, independent commercial/Order
review, RBAC client-boundary review and platform verification record. Those
reports retain their own execution scopes and limitations; their test results
are not fresh executions by this reviewer.

The load-bearing reread covers:

- Host's Blog composition and narrow client Provider, Blog's feed client
  boundary and curated Article-list empty state;
- current-account presentation and the principal-keyed Article editor;
- Subject's Article creation service and transaction/lock ownership;
- raw Social Profile middleware and its API ordering before both response
  caches;
- Ecommerce's extended Order receipt/currency compatibility read;
- the SDK client directive, narrow Provider alias and bounded Host memory
  configuration.

Relevant entity READMEs agree with those inspected paths. The existing detailed
reviews cover the remaining generated relation, Studio, fulfillment and public
author implementation. This is a selective final review of a 609-file change,
not a new audit of every unchanged repository import or every emitted chunk.

## Confirmed source behavior

The new Blog client Provider imports React and type contracts through its narrow
public entry. Host creates its author callback inside that client runtime;
server-created callbacks resolve beside server readers. The feed drops the
server author callback before rendering its client view. Its children cross
the Provider boundary as rendered JSX. These paths supply no SDK object,
database connection or ordinary server callback to the client view. The
previous broad Provider/admin/feed cycle is absent from the new narrow path.
This source inspection establishes composition; the production result is below.
It does not establish a thermal cause.

The curated Article Widget renders its empty state when its exact membership
query is empty. The separate feed retains its explicit global list operation.
Account presentation derives sign-in state from `authenticationMe`; a guest JWT
does not acquire Article publication. Account and editor children are keyed by
Subject ID, and the editor preserves the submitted payload/request UUID after
an uncertain result. Definite client rejections permit an explicit draft edit
with a new request UUID.

Article creation validates its bounded input, checks a human Subject with an
Identity, chooses the owned Profile on the server and creates the Article and
its owner/author/category links inside the Subject transaction. A replay checks
the exact saved graph and normalized payload. A competing foreign UUID collision
fails without exposing another record. The service does not accept a caller's
author/owner ID or replace the atomic operation with HTTP calls.

Raw Profile reads require the operator or a fresh explicit Role-to-Permission
binding. The middleware runs after authorization/query parsing and before both
response caches. Its exclusions preserve the named allowlisted author routes;
the separate legacy author-cache exclusion prevents a stale public projection.
The earlier real PostgreSQL/Hono/cache checks cover the warm-cache and revocation
cases; no new runtime claim follows from this source reread.

The Order compatibility read rejects paid Invoice currency conflicts before
selecting a saved receipt. It retains a matching Invoice amount and supported
Intent interval, while commerce Product type owns delivery. An unbilled retired
currency can remain readable without becoming a current checkout quote. The
strict checkout command is unchanged. The independent correction and root's
45 passing Order tests address the previously reported cross-currency mismatch.

## Accepted existing verification

The platform record contains focused backend/frontend/tool suites, actual
PostgreSQL transaction and fulfillment checks, clean fixture removal, Host and
Studio type checks, scoped lint, Studio validation, module-order/placement checks
and deployed capture coverage. The API type check retains twenty documented
baseline diagnostics; it is not a clean type-check PASS.

Commercial application now has confirmed monthly Pro terms, independent source
review and root's SDK readback. The recorded apply creates 70 records and updates
six configuration records. Repeat performs zero writes; fresh preparation needs
zero operations; rollback/reapply preserves additive records. All seven old Pro
Orders remain readable, and 84 protected selections containing 669 rows match.
Publication performs no payment, checkout, grant or token deduction.

The numeric Token Key correction has a separate independent source verdict in
`ISSUE-376-final-source-review.md`. Its one additive Key and six exact
association updates preserve the old shared Key and numeric credit values. The
recorded apply/readback, repeat with seven skips and fresh preparation with zero
operations retain all 84 protected selections. The current commercial input has
77 targets. Browser R2 confirms numeric Tokens on Pro and all five packs.

The same independent report accepts the four Category cover-framing files after
the active/default association filter correction. This final reviewer also reads
the two later class-only framing corrections and their emitted CSS. They
preserve the exact active/default query, saved media, readers, props and domain
state. The production target precedes this last visual correction; its bounded
dev acceptance is recorded below.

## Final acceptance evidence

| Required evidence                                                                                        | Current evidence                                                                                                                                         | Acceptance state                                                                                    |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Production Host build and built-Host requests                                                            | The new Next/Nx build completes all phases; 18 routes each return 200 on first and repeated requests without the recorded error/private markers          | Passed for that artifact, before the final Category class-only correction; wrapper limitation below |
| Current dev Host                                                                                         | Earlier 15-route matrix and final Framework/Category recheck return 200 without error/private markers; the Category recheck includes the final classes   | Passed within those recorded routes                                                                 |
| Exact 320 CSS px, EN/RU navigation and focus                                                             | Independent `ISSUE-376-browser-r2.md` verifies all three measured widths at 320, EN/RU menu focus/Escape, public pages, cart and quick-checkout controls | Passed within the report's public scope                                                             |
| Registered account → owned Profile/initial credits → first Article → feed/author → logout/account switch | Real A/B registration graphs, Article replay/ownership and built-browser publication/feed/author/draft/logout/B transition pass                          | Passed, with cleanup and registration-adapter limits below                                          |
| Commercial catalog in the current running Host                                                           | Independent browser R2 verifies monthly Pro prices, numeric credits and five pack values in EN/RU after the data correction                              | Passed within the public UI and protected saved-data evidence                                       |
| Category cover framing                                                                                   | Corrected source and generated rule produce measured 16:9 frames on desktop and exact 320 px                                                             | Resolved P2; no repeat production build for this class-only correction                              |
| Local environment after acceptance                                                                       | Normal `npm run api:dev` and bounded `npm run host:dev` are restored; real public/API and Host routes respond                                            | Passed within the recorded readiness and cleanup scope                                              |

## Completed production build

This reviewer read the complete 57-line
`/tmp/issue376-production-resume-build.log` and inspected the fresh production
`BUILD_ID`, routes, build, prerender and app-path manifests. Next completes
compilation, type validity, page-data collection, all eight static pages,
optimization and trace collection. Its final route table is present, followed
by `NX Successfully ran target next:build for project host`. The production
build ID is `MKpFtIHdiJJQqecTuXDQO`. These outputs establish a completed Next/Nx
target; the earlier build stopped during type checking remains unaccepted.

The temporary Python CPU supervisor fails with `PermissionError` when it tries
to signal the already-ended process group after target completion. Its outer
command therefore exits 1 and produces no final resource JSON. Root's periodic
samples include 2803.1 MiB peak observed RSS and 516.7 seconds before completion;
they do not prove a resource ceiling throughout the entire command. This
review accepts the completed build from its target log and artifacts, without
claiming that the supervisor exits 0 or that complete resource accounting
passed.

Root serves that output through `npm run host:start`. This reviewer read all 36
records in `/tmp/issue376-built-http.json`: 18 EN/RU Framework, About, Blog,
Authors, editor, Ecommerce, Category and Article paths each return 200 on first
and repeated requests, with an empty recorded error list. Maximum response time
is 0.826 seconds. The recorded checks exclude Next error markers,
`DYNAMIC_SERVER_USAGE`, the protected Widget ID and private marker. This matrix
establishes those response checks; browser account behavior remains separate.

## Temporary registration harness review

The independent final reviewer read the initial complete 935-line version of
`/tmp/sps-issue376-auth-fixture/harness.ts`. This is temporary local test code,
outside the deliverable source. No harness command was executed by this
reviewer. This source verdict does not establish successful registration,
publication or cleanup.

The harness imports the real API app, authentication and effective Services.
Its notification substitution applies only to an absent-from-baseline Order
with one owner equal to a fixture-created Subject. It changes only
`notifyAdmin` and `notifyOrderOwner`; requests and Orders outside that exact
graph retain the original methods. Fixture-scoped fetch permits local API
loopbacks and Host revalidation and rejects other transports. The committed
account audit reads the actual Identity, Profile, Free Order, Invoice and
wallet; it does not supply any of those records or credits.

No confirmed isolation defect was established in that path. Production
`dispatchPaidEffects` catches notification errors, so successful HTTP responses
alone cannot accept the harness. Root must require zero recorded safety
failures, inspect suppression ownership, and verify the final graph and cleanup.
Cleanup requires a stopped listener and compares every nonfixture captured row
inside the deletion transaction. Any preexisting drift or unclassified new row
must remain visible in the final receipt; those rows must not be adopted merely
because their creation occurred during the test window.

The current temporary script uses the project's `verifyJwt` adapter, an explicit
fixture-state argument and `SIGUSR2` for its own clean stop. Its resume path
retains the original baseline and refuses changed preexisting rows. These are
test-harness corrections; they add no production authentication bypass.

## Authenticated runtime checkpoints

The named Identity mutation correction has a separate independent source PASS
in `ISSUE-376-final-source-review.md`. Canonical UUID record lookup is separate
from the raw action segment; named mutations still parse and guard their body.
Root reports 20 focused access tests and the real PostgreSQL/Hono/Redis private
cache-and-bytes scenario passing after that correction. The source change is
API-only and does not alter the frozen Host frontend artifact.

This reviewer read `/tmp/issue376-auth-registration-proof.json`. Both new
fixtures have one human Identity, one personal Profile, one initial Free Order,
one paid Free Invoice and a Token balance of 3000. B registration returns 201.
A's registration commits before a temporary adapter error; it is not represented
as a successful 201 response. Root subsequently exercises A's normal browser
login. The receipt records four suppressed fixture notifications and zero
safety failures. Its `fixturesCleaned: false` describes this pre-cleanup
checkpoint; the final cleanup receipt below supersedes that state.

The Article replay receipt records one actual created Article and its owned
author. Repeating the identical request UUID/payload returns the same Article;
the exact Article/owner/author/category graph remains unchanged. A foreign B
collision returns 409; A targeting Subject B returns 401. No safety failure is
recorded.

The independent built-Host browser addendum in `ISSUE-376-browser-r2.md` now
covers normal A login, first publication, one card in the fresh global feed,
the owned UUID author portfolio and the conditional My author page menu item.
A new unsaved draft has three unique values. After Sign out, the guest editor
has a sign-in gate; after B login, all three fields are empty and A's draft and
Profile are absent. B without a subscription sees the private Article gate
without the marker or hidden Widget ID. After B logout, the created public
Article/byline remain readable and editor inputs are absent. The browser
records no console errors for that pass. These are built-browser observations,
not inferred results of the service tests.

This reviewer reads `/tmp/issue376-final-cleanup-proof.json` and the independent
read-only `/tmp/issue376-fixture-cleanup-review.json`. The cleanup removes 92
fixture IDs, records zero safety failures and baseline drift, and preserves all
nonfixture captured rows. Both fixture Subjects are absent. Four additional
default-variant Subjects remain preserved; the independent repeatable-read
review finds no reference to them in any of the twelve actual Subject foreign
key columns. Their state is consistent with ordinary orphan guest initialization.
Their provenance and non-FK data are unassigned, so no additional deletion or
retention policy is inferred. The private `cleaned-needs-review` label remains
as the original audit record; this bounded independent classification resolves
the handoff question. A fresh commercial preparation after cleanup has zero
operations across 77 targets and retains all 84 protected selections.

Unchanged CRM submission retains its earlier real PostgreSQL Request and
Form–Request relation proof, combined with the current browser field/schema
checks. No new notification-emitting browser submission is required for this
unchanged operation. Private-content acceptance combines the actual
authorization/cache/bytes matrix with the fresh browser account-state
transition and guest gate; it does not claim a paid-subscriber browser session.

## Resolved P2: Category cover ratio

The built-browser finding is reproduced in `ISSUE-376-browser-r2.md`:
`/en/ecommerce/categories/design` has an `aspect-video` wrapper whose computed
ratio is `auto`. Its desktop frame is 1216.015625 × 1216.015625 and its actual
320 px frame is 272 × 272. The intended 16:9 framing is therefore absent even
though the page has no horizontal overflow.

The final two runtime/Studio components use `relative aspect-[16/9]` and place
the image child absolutely inside that frame. This reviewer reads both files
and the actual emitted `.aspect-\[16\/9\]` rule in the current Host CSS; it sets
`aspect-ratio: 16 / 9`. The independent final browser check measures
1216.015625 × 684.00390625 on desktop and 272 × 153 at 320 CSS px. The child
matches the frame, the image uses `object-fit: cover`, and overflow is clipped.
Mobile inner, client and scroll widths are all 320. The reviewer also inspects
the saved final mobile screenshot. The confirmed square-cover finding is closed.

MultipleMedia and WithoutMedia retain separate source/fixture review; the final
browser geometry result covers the saved single-media runtime example. No
Storybook compiler or production rebuild was repeated for this literal
class-only change. That is a bounded verification choice under the thermal constraint,
not a claim that the earlier production artifact contains the final classes.

## Restored services and handoff limits

Root restores normal `npm run api:dev` on 4000 and `npm run host:dev` on 3000.
The final dev Framework and Category responses return 200 without Next error
or private markers; the cold Framework request takes 83.643 seconds and Category
1.093 seconds. Actual public Blog and Product API routes return JSON 200. The
API root itself returns 403 and is not used as a health proof. Current
consistency status has zero lag, pending deliveries, dispatch/client failures,
and an empty last error, with `degraded: false`. Generated Host TypeScript
include changes are restored by root.

The accepted verification retains material limits: the API type check has
twenty known baseline diagnostics; the supervisor's outer exit is 1 after the
completed target; the last two-file Category CSS correction is verified in dev
after the production artifact; and no paid-subscriber browser transition or
new notification-emitting CRM submission is claimed. Existing real service,
PostgreSQL, cache and bytes proofs cover those unchanged boundaries. No external
payment or notification is part of this acceptance.

The reviewed R2 gates support the Code Review handoff with these explicit limits.
Root owns the remaining documentation/commit/status bookkeeping. The user's
human Code Review remains open; this reviewer performs no issue transition,
PR, push, merge or Done action.
