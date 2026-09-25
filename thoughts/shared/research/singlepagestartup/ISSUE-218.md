---
date: 2026-07-28T16:56:36+03:00
researcher: flakecode
git_commit: 592f6160bf05d57a0bb5b1b6751442c755906cb4
branch: main
repository: singlepagestartup
topic: "Fix page-cache handler for string URL values"
tags: [research, agent, host, page-cache, url]
status: complete
last_updated: 2026-07-28
last_updated_by: flakecode
---

# Research: Fix page-cache handler for string URL values

**Date**: 2026-07-28T16:56:36+03:00
**Researcher**: flakecode
**Git Commit**: 592f6160bf05d57a0bb5b1b6751442c755906cb4
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Can issue #218 be reproduced against the locally running SPS stack, and what
current route, data contract, execution order, language configuration, and test
patterns govern the failing page-cache handler?

## Summary

The issue reproduces against the locally running API without code changes.
An authenticated `POST` to
`/api/agent/agents/host-module-page-cache` returns HTTP 500 with
`url.url.join is not a function`. A separate read from
`GET /api/host/pages/urls` returned 60 records whose `.url` values were all
JSON strings, including the root record `{ "url": "/" }`.

The Host page service declares `urls: { url: string }[]`, constructs normalized
string values, and flattens them before returning. The Agent handler calls
`.join("/")` on each returned string while constructing `path`. That expression
is evaluated before the inner `try` containing `revalidatePage` and the page
`fetch`, so neither downstream operation is reached for the first URL.

The in-app Browser confirmed that the running Host page at
`http://localhost:3000/en` renders normally and has no console errors. No direct
UI control for this scheduled Agent endpoint exists in the inspected Host page
or the located admin settings flow, so the failing backend code path was invoked
directly against the local API.

## Detailed Findings

### Local reproduction

The local processes were listening on Host port 3000 and API port 4000. The
request body is not used. Authentication is supplied from the existing local
API environment without printing its value:

```bash
bash -lc '
  set -a
  source apps/api/.env
  set +a
  curl -sS -i -X POST \
    -H "X-RBAC-SECRET-KEY: $RBAC_SECRET_KEY" \
    http://127.0.0.1:4000/api/agent/agents/host-module-page-cache
'
```

Observed response:

```text
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

"error":"Internal server error: url.url.join is not a function.
(In 'url.url.join(\"/\")', 'url.url.join' is undefined)"
```

The returned stack points to
`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:61`,
where the original error is converted to `HTTPException`.

A read-only request to the Host URL endpoint produced this compact contract
check:

```json
{
  "count": 60,
  "first": {
    "url": "/rbac/subject/authentication/email-and-password/registration"
  },
  "root": {
    "url": "/"
  },
  "value_types": ["string"]
}
```

### Route and authorization chain

- The root API mounts the Agent module at `/api/agent` after the authorization
  middleware (`apps/api/app.ts:171-180`).
- The Agent module mounts the agent model app at `/agents`
  (`libs/modules/agent/backend/app/api/src/lib/apps.ts:19-23`).
- The model controller binds `POST /host-module-page-cache`
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:80-83`).
- The resulting local route is
  `POST /api/agent/agents/host-module-page-cache`.
- Authorization reads `X-RBAC-SECRET-KEY` or the corresponding cookie and
  accepts a key matching server configuration
  (`libs/middlewares/src/lib/is-authorized/index.ts:39-60`).
- The handler also verifies that the server-side `RBAC_SECRET_KEY` exists before
  reading URLs
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:15-23`).

### Host page URL contract

- `EntityWithUrls` declares `urls: { url: string }[]`
  (`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:11-13`).
- A root page returns `{ url: "/" }`
  (`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:180-182`).
- Non-root paths are constructed from segment arrays and converted to strings
  with a normalized leading slash
  (`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:184-198`).
- `urls()` gathers each page's records and returns one flattened array
  (`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:225-238`).
- The public Host controller returns that array under `data.urls`
  (`libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/urls/index.ts:13-19`).

### Agent handler execution order

1. The handler loads the flattened Host URL records
   (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:21-23`).
2. It loops over each record and each configured language
   (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:25-27`).
3. It calculates an empty prefix for the default language and `<code>/` for
   other languages
   (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:28-31`).
4. It evaluates `url.url.join("/")` while assigning `path`
   (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:33`).
5. Because `url.url` is a string, the assignment throws before execution enters
   the per-page `try` at line 35. `revalidatePage` at line 36 and the page
   `fetch` at lines 38-40 are therefore not reached.
6. The outer catch maps the error and throws `HTTPException`
   (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:58-61`).

### Language configuration

The current internationalization configuration contains English (`en`) and
Russian (`ru`), with English as the first/default language
(`libs/shared/configuration/src/lib/internationalization/index.ts:1-13`).
The handler's current prefix calculation therefore produces `""` for English
and `"ru/"` for Russian before it reaches the failing expression.

### Existing test patterns

- No test file currently references `host-module-page-cache`,
  `HostModulePageCache`, or `page/cache`.
- Nearby Agent scheduled-controller tests use a top-level BDD JSDoc, mock
  `@sps/shared-utils` and `@sps/backend-utils`, create a minimal Hono-like
  context, instantiate the Handler with a mocked service, and assert observable
  service calls
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/check.spec.ts:1-43`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/check.spec.ts:51-73`).
- The Agent Nx project exposes `jest:test`, `jest:integration`, `tsc:build`, and
  `eslint:lint` targets (`libs/modules/agent/project.json:8-13`).
- The root package provides a focused test-file command and scoped unit and
  integration lanes (`package.json:26-30`).

### Existing non-UI invocation

The API seed flow contains a delayed fetch to the same page-cache URL with the
RBAC header (`apps/api/src/db/seed.ts:419-428`). That fetch does not specify a
method, while the controller registers the route as POST.

## Code References

- `apps/api/app.ts:171-180` - authorization middleware and Agent module mount.
- `libs/modules/agent/backend/app/api/src/lib/apps.ts:19-23` - `/agents` mount.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:80-83` - page-cache POST route.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:15-61` - failing handler execution.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:11-13` - URL record type.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:180-198` - root and nested string construction.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:225-238` - flattened URL array.
- `libs/shared/configuration/src/lib/internationalization/index.ts:1-13` - language configuration.
- `libs/middlewares/src/lib/is-authorized/index.ts:39-60` - secret-key authorization.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/check.spec.ts:1-73` - adjacent BDD controller-test pattern.
- `apps/api/src/db/seed.ts:419-428` - delayed seed fetch to the page-cache URL.

## Architecture Documentation

The root README describes backend layering as Repository → Service → Controller
→ App. This issue crosses the Host page service contract and the Agent
controller handler. The Host model README describes pages as routable site
containers, while the Agent model README describes agents as scheduled
automation units. The failing endpoint is consequently an Agent automation
controller consuming the Host page service's routable URL records.

## Historical Context (from thoughts/)

No earlier process, research, plan, or ticket artifact about Agent page-cache
URL handling was present. The local ticket snapshot for this issue is
`thoughts/shared/tickets/singlepagestartup/ISSUE-218.md` and records the
production signature, reproduction outline, and acceptance criteria from
GitHub.

## Related Research

No related research document was found in `thoughts/shared/research/singlepagestartup/`.

## Open Questions

- The current seed fetch defaults to GET, while the registered page-cache route
  is POST. Whether this invocation-method mismatch belongs to issue #218 remains
  a scope question for planning.
