# ISSUE-376: final source review

Reviewer: `public_widget_relations` using `review-pr`.
Date: 2026-10-24, Europe/Moscow.
Revision: working diff over `3e6447dbf9fbd90b380ab771684a68dadc7d2d7c`.

Verdict: **source PASS for the scope below after correction**. No actionable
source finding remains open in this scope. This verdict does not accept the
whole implementation phase or its remaining runtime gates.

## Scope and independence

Reviewed root's RBAC `widgets-to-ecommerce-module-widgets` package and curated
Product reader; Website Builder hero, feature grid, Feature card, footer column,
footer, Logotype, collection/form frames and loaded-props corrections; Host
Blog/Social/navbar compositions; the Blog client render-port Provider and public
alias; the Social author client SDK directive; and the two private-Article CTA
destination corrections.

The latest Studio review covers ten new public-entry story contracts and their
Figma metadata, the catalog's two early-return roots, the Article form's guest
root, and the Authors directory's NoProjects fixture correction. The applicable
sources are the active platform plan, platform reviews, frontend/component,
module-dependency, code-placement and Studio contracts, and owning READMEs.

The reviewer's own Blog/Social Widget-to-Website Builder relation implementations
are excluded from this independent verdict. Their separate independent review
is recorded in `ISSUE-376-platform-reviews.md`; their database execution evidence
is in `ISSUE-376-widget-presentation-relations.md`. The README cleanup listed
below is also authored work, not an independent approval of those edits.

The pending commercial input/application and subsequent legacy Order read
correction are outside this source snapshot. Neither is accepted by this report.
No test, type checker, Nx task, build, browser, server or CMS mutation was started
for this final review. Only source/document reads and `git diff --check` ran;
the latter exited 0.

## Findings resolved in source

**P2 — empty Popular curation selected every Article.**
`libs/modules/blog/models/widget/frontend/component/src/lib/singlepage/article/list/default/Component.tsx`
previously replaced an empty `widgets-to-articles` result with an unfiltered
Article `find`. Removing the last membership therefore displayed every public
Article instead of the empty selection required by R2.3. This was an established
code path, not a browser reproduction or a private-content disclosure.

The corrected branch renders the localized empty state. The ordered association
reader, props-loaded relation rendering and Author slot remain; Article is still
used for individual loading views. There is no fallback collection request in
that branch. The separate `article-feed-default` remains the explicit global
feed. The legacy Category collection's fallback is unchanged and documented.

**P2 — the new client render port imported an admin barrel cycle.**
The feed's `client.tsx` and Host Blog `ClientComponent.tsx` imported the Blog
frontend package barrel. That barrel reexported the module's admin compositions,
whose Widget import reached the public Widget registry and the same feed client.
This introduced an intra-Blog import cycle and an additional admin dependency
path from the new client consumers. No runtime initialization failure, memory
measurement or cause of machine overheating was established from this graph.

Both consumers now import `@sps/blog/frontend/component/provider`. The exact
`tsconfig.base.json` alias resolves to the existing
`libs/modules/blog/frontend/component/src/lib/provider/index.tsx`. The broad
frontend barrel no longer reexports the new Provider. The narrow entry imports
only React at runtime and its own interface as a type; the interface's Article
render-port dependency is type-only. Source search finds only the intended Host
and feed runtime consumers. This removes the new barrel cycle without adding a
module, inheritance layer or business-variant dispatch.

**Studio NoProjects preview.**
`apps/studio/modules/social/widget/singlepage/author-list-default/Component.tsx`
now supplies `productCount={props.noProducts ? 0 : i}`. Its NoProjects story
therefore describes the rendered fixture; previously the flag was unused and
some cards still reported projects. Production Author data is unaffected.

## Server/client and ownership assessment

Host Blog renders the exact saved Widget through Blog's public registry. Its
client wrapper receives only `language` and rendered React-node children. It
creates the author callback inside that client runtime and provides it through
the narrow Blog context. The feed explicitly omits a server `renderAuthor`
callback at its client boundary, then consumes the client port. Article and
Category server callbacks remain in their server compositions. The complete
Page URL map stays inside the named-value callback; explicit slugs/Profile UUIDs
are passed to their owning models.

No SDK object, database handle or ordinary server callback crosses the reviewed
Host client boundary. New nested SPS components in client files use
`isServer={false}`. The shared model template retains its existing client/server
SDK bindings and a separate `"use server"`/`server-only` reader; it strips reader
implementation bindings before rendering views. Merely seeing both SDK imports
in that template is not evidence that its server reader body executes in the
browser. The Social author hook file starts with `"use client"`; its network
operation uses the supplied client host and saturated client headers.

The RBAC catalog selects one exact owning Ecommerce Widget and only its ordered
Product memberships. Empty or invalid configuration does not select all Products.
The new relation has ordinary API/SDK/admin registration, generated pair-unique
and cascading-FK schema, aggregate migration targets and consistency capture.
Current-Subject cart/checkout actions remain in RBAC. The Category reader likewise
uses its saved Widget membership and props-loaded target records.

Website Builder retains saved content and SDK relation reads. The reviewed
loaded rows and targets use props mode and ID keys, preserving the collection
reader's Provider/cache ownership. The two `hidden` renderers return null without
reading a target; they do not replace backend authorization. Collection/form
frames receive rendered children/footer slots and no principal or business mode.
The new imports inspected here follow the confirmed module order. This is not a
new full-repository import-graph audit.

The private-Article changes affect only localized destinations:
`/rbac/subject/authentication/select-method` for a guest and `/ecommerce` for a
subscription choice. The grant predicate, deadline, principal-scoped query
cleanup, protected media lifetime and conditional private Widget rendering are
unchanged by those two edits.

## Studio and documentation closure

The ten story directories are:

- `apps/studio/modules/blog/widget/singlepage/article-feed-default`
- `apps/studio/modules/rbac/subject/singlepage/me-blog-module-article-create-default`
- `apps/studio/modules/rbac/widget/singlepage/subject-me-blog-module-article-create`
- `apps/studio/modules/social/profile/singlepage/author-byline-default`
- `apps/studio/modules/social/profile/singlepage/author-card-default`
- `apps/studio/modules/social/profile/singlepage/author-overview-default`
- `apps/studio/modules/social/widget/singlepage/author-list-default`
- `apps/studio/modules/social/widget/singlepage/author-overview-default`
- `apps/studio/modules/website-builder/widget/singlepage/content-collection`
- `apps/studio/modules/website-builder/widget/singlepage/content-form`

Each story imports the public model entry, supplies a literal `args.variant`,
and narrows its Meta contract to that variant. Each `figma.json` matches its
block manifest's source, block ID, layer, variant and component/story paths.
Null node IDs remain consistent with `syncStatus: not-created`; this metadata
does not claim that a Figma artifact exists. The catalog's unavailable/empty
paragraphs and the Article form's guest link now retain their owning module,
model and variant DOM metadata. No production SDK or Workspace import was found
in these new Studio directories. Test execution after these last corrections is
a separate gate.

Authored documentation cleanup covers the new RBAC relation README; Website
Builder, Blog and Social Widget variant lists/composition; Host Page-to-Widget
and Website Builder Widget-to-ButtonsArray hidden behavior. The Blog README now
distinguishes the curated Article list from the global feed and names the narrow
Provider entry. Existing RBAC lifecycle documentation describes initial Free
once and retained additive credits; runtime tooling documentation distinguishes
the optional native Turbo target from the Node heap and total process memory.

## Evidence limits and remaining acceptance

The existing platform reviews record focused backend/editor/tool results, real
PostgreSQL/Hono checks and public graph apply/readback/repeat/rollback evidence.
The 169-target public graph apply retains financial and protected-content
observations. Those results have their own authors and commands; they are not
new executions by this reviewer. The known API type-check baseline has twenty
diagnostics and must not be described as a clean pass.

Root's latest runtime evidence reports fifteen EN/RU dev HTTP responses with no
observed server/private-marker errors; public Author DTO and denied raw Profile
controls; desktop Category/Article cover navigation, an author with six Articles
and two Projects, and cart add/drawer/remove at USD 100. The narrow viewport
actually measured 400 CSS pixels, with no horizontal overflow and working
account menu/Escape/focus return. The guest private block remains locked and its
corrected CTA destination was checked. These observations do not prove a 320 px
layout, complete registered-session lifecycle or a final production build.

Remaining acceptance includes the post-correction Studio/check results, a final
frozen production Host build if resource conditions permit, exact 320 px and
registration/first-publication/account-switch flows not yet evidenced, and the
commercial saved-data cutover. The Pro period is now confirmed as monthly,
alongside USD 29/RUB 1900; confirmation alone does not prove its prepared graph
was reviewed, applied or verified. The later legacy Order correction also needs
its own independent review and checks. This scoped source PASS supplies none of
those missing results and changes no workflow status.

## Addendum: numeric Token key input

Verdict: **source/manifest PASS for this bounded data correction before apply**.
This reviewer did not author the input and performed no API call, data/source
write, server operation or test. Only this review receipt was added. The earlier
commercial exclusion above remains in force for work outside this correction.

Reviewed input hashes and the prepared receipt at review time:

| File                                                                  | SHA-256                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ISSUE-376-commercial-topup-key-input.json`                           | `0219ce119476ced74192c298aa678cbfc755f4ad149024c489539af5d0ef05a5` |
| `ISSUE-376-commercial-confirmed-input.json`                           | `1a3edddb6f7efc6ace65ea5791dd6fb66fa87f2c5874ad05401ed10e7e9bd385` |
| Private `.git/sps-runtime/issue-376/commercial-topup-key-before.json` | `ad19d1a22821f44909f6e703fc4d269060705359c4a2a1c5edd1bc167460ee96` |

The receipt is `prepared`, mode 0600, bound to `http://localhost:4000`, and its
embedded input equals the tracked bounded input. Private protected row values
are not reproduced here.

Its seven operations are exactly one new `ecommerce.attribute-key` and six
existing `ecommerce.attribute-keys-to-attributes` updates. The new Key uses the
owning schema's existing fields: unique slug `token-credit-topup`,
`variant="default"`, `type="topup"`, `field="number"`, and localized
`Tokens`/`Токены` title. It precedes all references. Each existing update changes
only `attributeKeyId`; its exact ID and unchanged Attribute ID match the prepared
row. All six rows previously selected the legacy shared Topup Key. They also
match the six pinned association IDs in the revised canonical commercial input.
Both inputs have unique target keys and no unknown or forward references.

All 84 protected selections are retained unchanged from the commercial input,
including financial histories, ownership, balances, original configuration and
the closed-content graph. The receipt's selectors match them, and no operation
intersects a protected row. The old Key
`e005389b-41c4-4efb-89a2-6d84a354cfed` is explicitly protected and retains its
`topup` type and `string` field. Neither input changes that old Key for this
repair. The bounded operation set contains no Attribute amount, Price, Currency,
Product membership, Free, Order, Invoice, Role or wallet write. All six switches
follow the additive Key's create/readback.

The source establishes the display mismatch and the bounded effect:
`libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/default/Attributes.tsx:88`
passes the selected Key's field to the Attribute renderer;
`libs/modules/ecommerce/models/attribute/frontend/component/src/lib/singlepage/default/Component.tsx:7`
selects localized `string` or the declared numeric field. In contrast,
`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:542`
selects Topup by type and line 546 reads `attribute.number` directly. Preserving
the `topup` type, numeric Attribute values, quantity and Currency links preserves
that calculation while correcting the displayed field. No consumption or
frontend code change is part of this repair.

Root still owns the exclusive maintenance window, fresh protected-drift checks,
actual create-ID remapping, apply/readback, repeat and fresh-prepare zero writes,
and browser confirmation of the Token amounts. This review does not claim those
operations ran. The existing rollback restores the six changed references only
when its drift/protected checks permit and retains the additive Key. It supplies
no financial rollback and no transaction across the seven HTTP writes.

## Addendum: Category cover framing

Verdict: **narrow source PASS after correction**. This reviewer inspected the
four frozen files only after the author signalled readiness and authored none
of their changes:

- `libs/modules/ecommerce/models/category/frontend/component/src/lib/singlepage/overview-default/Component.tsx`
- `apps/studio/modules/ecommerce/category/singlepage/overview-default/Component.tsx`
- `apps/studio/modules/ecommerce/category/singlepage/overview-default/Component.stories.tsx`
- `apps/studio/modules/ecommerce/widget/singlepage/category-overview-default/Component.stories.tsx`

**Resolved P2 — hidden covers entered the default renderer.** The initial
framing patch changed every File relation row to `variant="default"`. The
relation SDK also supports saved `hidden` links, so that patch would render a
retired cover and count it toward the two-column layout. This was an established
presentation path, not proof of private-byte access.

The final `CategoriesToFiles` reader filters both the exact `categoryId` and
`variant="default"` under `apiProps.params.filters.and` before counting or
mapping. Only those active rows reach the default relation renderer. One active
cover occupies the full grid width, multiple active covers use two columns from
`sm`, and no active covers produce no gallery. Hidden rows remain stored and do
not trigger target reads through this composition. Each active row retains its
ID key, props-mode data and locale inside a rounded `aspect-video` frame. Existing
relation traversal and ordering behavior are unchanged.

The Category header, localized title/subtitle/description, overview Website
Builder relations and rendered children remain. No saved field, relation, media
record or heading is removed or hidden to achieve the layout. The ordinary
singlepage default reader, API bindings, Skeleton and client/server boundaries
are unchanged.

Studio uses the existing default cover and the same single/multiple framing.
Both the model and its Widget recipe expose MultipleMedia and WithoutMedia
stories through public model entries. `media: null` explicitly suppresses the
Studio default image. These are presentation fixtures; they add no production
data access.

`git diff --check` passed for the four files. No test, build, type checker, API,
server, browser or source edit was run by this reviewer. The post-change rendered
layout and any production build result remain root's runtime evidence.

## Addendum: named Identity action and protected mutation lookup

Verdict: **narrow source PASS**. This reviewer inspected the author's frozen
changes in `protected-blog-content/index.ts` and `blog/article/access.spec.ts`,
the unchanged owning `WriteAccess` service and Identity controller, and the real
registration checkpoint recorded in `ISSUE-376-platform-reviews.md`. The reviewer
did not author this fix.

The middleware now separates a canonical `recordId` from `requestedId`. The
existing decoded, lowercased, brace/hyphen normalization still accepts exactly
32 hexadecimal digits for a record lookup. Only that canonical UUID reaches
the non-bulk `WriteAccess` lookup. An action segment such as
`email-and-password` therefore no longer reaches the Identity repository as a
UUID. `requestedId` retains the raw segment when it is not a UUID, preserving
the existing read handling.

This changes lookup classification, not authorization. Named mutations still
read the protected graph and principal, clone and parse the request body, and
invoke `WriteAccess` before the owning route. Its checks for protected Website
Builder and File references still run without an existing record. No named
action allowlist, mutation early return, new guest permission or operator bypass
was added. Existing route permissions and handler validation remain responsible
for the action. The array branch retains its protected-reference scan and
per-item lookup; `find-or-create` retains its body validation without treating
its action name as a record ID. The transaction, graph lock, fail-closed error
mapping and static/content guards are unchanged.

The new Hono harness tests assert that a named action returns 201, receives its
untouched JSON body and makes no UUID lookup; that either a protected Widget or
File body reference returns 409 before its handler; and that canonical,
uppercase, percent-encoded, braced and hyphenless UUID spellings resolve to the
same protected link and reject DELETE with 409. The former synthetic private
link fixture now uses a real UUID, so existing private-link DELETE and PATCH
assertions continue to exercise the production record classification. The
existing bulk-private-marker test remains unchanged.

`git diff --check` passed for the two changed files. These tests were read, not
executed by this reviewer. The happy-path harness echoes JSON rather than
executing the real multipart Identity handler. Focused test execution and the
root's repeated real registration remain required runtime evidence; this source
verdict does not establish successful registration or authenticated acceptance.
