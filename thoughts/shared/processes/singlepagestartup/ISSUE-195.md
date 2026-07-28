---
issue_number: 195
issue_title: "Smooth realtime data updates without full component rerenders"
repository: singlepagestartup
created_at: 2026-06-10T11:23:52Z
last_updated: 2026-06-10T12:12:06Z
status: active
current_phase: plan
---

# Process Log: ISSUE-195 - Smooth realtime data updates without full component rerenders

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: not_started
- Current phase: implement
- Next step: complete implementation and submit PR.

## Phase Notes

### Create

- Summary: Creating a new SPS workflow issue from user-provided realtime update implementation notes.
- Outputs:
  - Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-195.md`
  - Process artifact: `thoughts/shared/processes/singlepagestartup/ISSUE-195.md`
  - GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/195
- Notes:
  - User explicitly requested `core-00-create`.
  - Priority inferred as `high`, size as `large`, type as `feature/refactoring` from the implementation scope and cross-cutting frontend impact.
  - GitHub issue was created through `.claude/helpers/create_issue_with_project.sh` and transitioned from `Triage` to `Research Needed`.

### Research

- Summary: Documented the current realtime pipeline (revalidation middleware → WS broadcast → `globalActionsStore` → factory `subscription()` → `invalidateQueries` with a 1000 ms `setTimeout`), the generic `factory()` query/mutation layer, the social chat message list (Layers 1–3 targets), and the ecommerce cart/order universality check. Verified all crux files firsthand.
- Outputs:
  - Research: `thoughts/shared/research/singlepagestartup/ISSUE-195.md`
- Notes:
  - Key finding: chat queries bypass the generic `factory()` (hand-written SDK, one-element URL `queryKey`s, manual `meta.topics`), so the find query key is thread-scoped while update/delete mutation keys are chat-scoped — prefixes do not align (confirms Layer 3 needs explicit key patching).
  - Key finding: `setQueriesData`/`setQueryData` = 0 usages and `React.memo` = 0 in the chat dir — Layers 0 and 2 introduce brand-new patterns; everything currently relies on `invalidateQueries`.
  - Nuance for planning: chat message **update** SDK returns an array (`ISocialModuleMessage[]`) while create/delete return a single entity; chat mutation files already have an internal `onSuccess` with `...reactQueryOptions` spread last.
  - Used 3 parallel sub-agents (SDK query construction, ecommerce cart flows, thoughts/ history); cross-checked their claims against direct reads.
  - Review update: Browser verification on `localhost:3000` confirmed the host shell and mounted `revalidation` component, but did not expose chat UI; `localhost:4000` was not accepting API requests, so end-to-end WS/mutation behavior could not be verified live.
  - Review correction: Research now records that React Query query-key prefix matching is array-element based; `[factoryProps.route]` matches list keys like `[route, params]`, but not `[route/id, params]` or `[route/count, params]`.

### Plan

- Summary: Produced a 6-phase implementation plan: (1) shared React Query cache helpers + factory mutation integration (automatic coverage of all 168 factory-backed SDK clients across 16 modules), (2) chat composer rerender isolation, (3) chat timeline row memoization, (4) chat targeted cache patches + scroll-signature fix, (5) ecommerce cart universality verification, (6) convention documentation (shared-api README, revalidation README, CLAUDE.md review checklist). WS invalidation is preserved everywhere as the background consistency fallback.
- Outputs:
  - Plan: `thoughts/shared/plans/singlepagestartup/ISSUE-195.md`
- Notes:
  - User requested (in review of the plan outline) that the approach be explicitly codebase-wide; verified that all model/relation SDK clients spread `factory<IModel>()` (168 files importing `@sps/shared-frontend-client-api`), so factory integration covers all modules automatically; ~41 hand-written SDK files follow the documented contract opportunistically, with chat as the reference implementation.
  - Plan resolves the research open question on the chat update SDK returning `ISocialModuleMessage[]` (array): Phase 4 selects the message by edited id, falling back to refetch.
  - Phase 1 was expanded beyond the ticket's Layer 0 to handle `findById` (`route/id`) and `count` (`route/count`) key prefixes, since `[route]` prefix matching does not cover them (array-element matching).
  - Migration note flags an audit of existing `reactQueryOptions.onSuccess` factory-mutation callers, since internal cache handling will now run before user callbacks.
  - Plan-review amendment 3 (reviewer corrections, all verified in code): (1) `apps/api/app.ts:153-168` registers `HTTPCacheMiddleware` before `RevalidationMiddleware`, and Hono unwinds post-`next()` inner-first — so the WS broadcast currently fires BEFORE the http-cache bump; awaiting bumps alone cannot fix it. Phase 5 now mandates reordering registration (revalidation before the feature-flag-conditional http-cache block) plus awaited mutation bumps. (2) `appendToListQueries` safety rule broadened from "filters" to ANY meaningful params (filters/orderBy/limit/pagination/search) — append only into param-less queries (or exact-key mode); each param class gets its own BDD scenario. (3) Chat timeline fetches already send `"Cache-Control": "no-store"` (`client.tsx:32,54` etc.), so the http-cache staleness is NOT a live bug; the Phase 4 exclusion is reframed as server-side defense-in-depth — critical because production runs `MIDDLEWARE_HTTP_CACHE=true` with `KV_TTL=43200` (12 h). Also added a manual-testing prerequisite: the seeded chat URL renders `Page not found`; implementers must establish an authenticated context where the chat actually renders before browser verification.
  - Plan-review amendment 2 (user requirement): cross-client realtime is now a hard requirement — "if another user changed data, I must see the update immediately". Added new Phase 5 (Immediate Cross-Client Reconciliation): remove the artificial 1000 ms `setTimeout` in factory `subscription()` (replace with ~0–200 ms jitter + existing `topicTriggerKey` dedup), and await http-cache version bumps for mutation methods so the WS broadcast cannot outrun backend cache invalidation. Entity payloads are deliberately NOT added to WS broadcasts: `/ws/revalidation` is a shared channel delivered to all clients, so payloads would leak private data; immediacy comes from instant targeted refetch rendered as a local row update (memoization + structural sharing). Former phases 5/6 renumbered to 6/7 (plan is now 7 phases).
  - Plan-review amendment (user question): the original plan missed the backend HTTP cache middleware (`libs/middlewares/src/lib/http-cache/index.ts`). Analysis: factory base routes are version-bumped correctly (mutation path minus UUID = list GET path), but chat message update/delete (chat-scoped paths) never bump the thread-scoped timeline GET path, so within `KV_TTL` (30 s) a reconciliation refetch can serve stale data and revert a correct local patch. Phase 4 now includes excluding the chat thread-messages GET (and evaluating the actions GET, which is fed by server-internal creations that never bump) from HTTP caching, following the in-file issue-152 exclusion precedent.

### Implement

- Summary: in_progress (Phases 1–9 complete; Phases 10–14 framework-grade canonical topic algebra complete: shared deriver, middleware extension APIs, topic-versioned http-cache, factory auto-meta.topics, two-tab browser + live cache verification)
- Outputs:
  - Shared cache helpers + factory mutation integration (`libs/shared/frontend/client/api/src/lib/cache/`)
  - Chat boundary split: `MessageTimelineSection` (queries + scroll + rows + edit dialog), `Composer` (form + create/AI mutations), shell (`ClientComponent`) connected via stable callback refs and `ThreadMessagesCache`
  - Immediate WS reconciliation (≤200 ms jitter), revalidation-before-http-cache middleware reorder + awaited mutation bumps, http-cache chat-path exclusions
  - Docs: shared-api README, revalidation README (two-tier model), CLAUDE.md review checklist
- Notes: Phase 1 and Phase 2 verified earlier (reviewer browser pass on a registered chat thread route). Phase 8 (review follow-up): message/action queries moved from `client.tsx` into `MessageTimelineSection`, so sends, AI refetches, and WS invalidation rerender only the timeline boundary; new BDD scenario asserts the shell does not rerender on message send; `clearSelectedSkills` now bails out when already empty (was scheduling a no-op shell rerender on every send).

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 3 -->

### Incident 3 — Per-listener topic dedup caused a refetch storm; missing thread-scoped topic rule rerendered the page

- **Phase**: Implement (Phase 9 - live-browser follow-up)
- **Occurrences**: 1
- **Symptom**: User reported full page rerender on every message send despite boundary isolation. Live measurement: ~440 API requests per send (~50 identical thread-messages GETs), chat overview page rerendering twice ~1–2 s after send.
- **Root Cause**: (1) `topic-rules.ts` had no rule for the thread-scoped message create path; the generic fallback broadcast broad topics (`social.chats.[cid]`, `social.profiles.[pid]`) matching the chat findById query's meta.topics — page-level invalidation on every send. (2) Factory `subscription()` deduplicated topic invalidations per listener while `invalidateByTopics` is global — one broadcast scheduled one global invalidation per subscribed route.
- **Fix**: Explicit thread-scoped topic rule emitting exactly the timeline topics; module-scope `globalTriggeredTopicKeys` dedup in the factory. Verified live in Chrome: 0 shell/page renders on send, one invalidation per broadcast.
- **Preventive Action**: Every new nested mutation route MUST get an explicit topic rule (generic fallback emits parent-entity topics). Global invalidation mechanisms must deduplicate globally. jsdom specs cannot catch cross-layer storm effects — verify realtime flows live with render counters + network capture. Dev note: `bun --watch` does not pick up `libs/` changes; `touch apps/api/server.ts` to reload middlewares.
- **References**: `libs/middlewares/src/lib/revalidation/topic-rules.ts`, `libs/shared/frontend/client/api/src/lib/factory/index.ts`, `subscription.spec.ts` ("deduplicates one broadcast across many route subscriptions").

### Incident 2 — form.watch rerenders the useForm host, not the caller

- **Phase**: Implement (Phase 2 - Composer isolation)
- **Occurrences**: 1
- **Symptom**: Rerender-isolation spec kept failing after moving `form.watch("description")` into `<Composer>`; `MessageTimeline` re-invoked on every keystroke despite bisecting out the sync setter and the watch-callback effect.
- **Root Cause**: react-hook-form `form.watch(name)` subscribes the `useForm` HOST component for re-render (here: chat `ClientComponent` via `useChatComposer`), regardless of which component calls `.watch()`.
- **Fix**: Replaced with `useWatch({ control: form.control, name })` inside `Composer`, which subscribes only the calling component. Kept the non-rendering `form.watch(callback)` form for side-effect-only sync in the parent.
- **Preventive Action**: For rerender isolation of form state, always use `useWatch` + `control` in the child; verify with a render-count spec that mocks the sibling component.
- **References**: `…/chat/message/list/default/components/Composer.tsx`, `ClientComponent.rerender.spec.tsx`.

### Incident 1 — Sandboxed GitHub network retry

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Initial helper run reported `error connecting to api.github.com` and returned an empty issue URL.
- **Root Cause**: GitHub network access was blocked in the sandboxed command environment.
- **Fix**: Re-ran the same `create_issue_with_project.sh` command with network escalation, preserving the helper-driven workflow.
- **Preventive Action**: For future core workflow GitHub operations, if `gh` reports `api.github.com` connectivity errors, retry the exact helper block with `require_escalated` instead of rewriting the GitHub sequence.
- **References**: `.claude/helpers/create_issue_with_project.sh`; `core-00-create` workflow.

## Reusable Learnings

- For realtime data issues, treat React Query cache patching as the first candidate before adding a second server-data store.
