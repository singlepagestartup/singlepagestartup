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
