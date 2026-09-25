---
issue_number: 218
repository: singlepagestartup
status: Research Needed
created_at: 2026-07-27T21:26:37Z
url: https://github.com/singlepagestartup/singlepagestartup/issues/218
---

# Issue #218: Fix page-cache handler for string URL values

## Problem to solve

The Agent page-cache endpoint fails before it can revalidate or fetch pages.
The Host page service returns URL records as `{ url: string }`, but the Agent
handler calls `.join("/")` on that string.

Observed production signature:

```text
TypeError: url.url.join is not a function
  at .../agent/.../controller/singlepage/page/cache.ts:61:17
  at new HTTPException (.../hono/dist/http-exception.js:6:5)
```

`POST /api/agent/agents/host-module-page-cache` returns an internal error and
page revalidation/fetching never starts. Expected behavior is to normalize every
Host page URL as a string and revalidate/fetch it for every configured language.

## Key details

- Type: bug
- Priority: medium
- Size: small
- Affected production service: `api_api`
- Production image: `singlepagestartup/didigallery:0.0.221`
- Production window: 2026-07-26T21:08Z to 2026-07-27T21:08Z
- Top-level error records: 656
- Matching signature lines: 704
- First seen: 2026-07-27T10:31:02Z
- Last seen: 2026-07-27T21:07:01Z

## Reproduction

1. Make `hostModule.page.urls()` return its documented value, for example
   `[{ url: "/" }, { url: "/gallery/item" }]`.
2. Execute the Agent host-module page-cache handler.
3. The first iteration calls `.join` on the string and throws before
   `revalidatePage` or `fetch`.

## Implementation notes

- The faulty call is reported at
  `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts`.
- The string service contract and construction are in
  `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts`.
- The issue records that upstream commit
  `082c8287ab839e6fe7bfd5c97e1e38a56b4aff66` contains the same call.
- This is a framework defect in `singlepagestartup/singlepagestartup`.

## Acceptance criteria

- [ ] Root and nested string URLs no longer throw.
- [ ] Default and non-default language paths contain the intended single slash separators.
- [ ] Every returned URL reaches revalidation and page fetch.
- [ ] Per-page failures remain isolated and do not stop later URLs.
- [ ] BDD tests cover `/`, a nested path, multiple languages, and a failed page followed by a successful page.
- [ ] A production-equivalent run emits no `url.url.join is not a function` errors.

## Test plan

- Add a focused BDD controller/service test with `{ url: string }` fixtures.
- Assert exact revalidation/fetch paths for root, nested, and localized URLs.
- Assert later URLs still run when one fetch fails.
- Run the affected Agent backend test target and TypeScript check.

## References

- https://github.com/singlepagestartup/singlepagestartup/issues/218

## Comments

No comments were present when the ticket snapshot was created.
