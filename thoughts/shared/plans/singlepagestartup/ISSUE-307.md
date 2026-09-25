---
date: 2026-09-26T00:30:00+03:00
issue_number: 307
repository: singlepagestartup
topic: "Validate URLs the API fetches on behalf of callers"
status: approved
---

# Outbound URL Guard Implementation Plan

## Overview

Put every URL that the API fetches for a caller through one guard in
`@sps/backend-utils`. The guard accepts only `http` and `https` URLs without
credentials whose host is one of the deployment's own service origins, an
explicitly allowed origin, or a name that resolves only to public addresses. A
fetch wrapper applies it to every redirect hop and bounds the time and the
response size. `create-from-url` and the observer pipeline switch to the
wrapper.

## Current State Analysis

`create-from-url/index.ts:35` and `observer/index.ts:249` call `fetch` with the
caller's URL unchanged, follow redirects, and read the whole body without a
deadline. Under Bun the same call reads `file:` URLs from disk and signs `s3:`
URLs with the process's credentials. The deployment's own flows reach the API
and the host through these call sites at loopback or overlay addresses
(`checkout.ts:801-859`, `generate/index.ts:46-56`). Details and evidence:
`thoughts/shared/research/singlepagestartup/ISSUE-307.md`.

## Desired End State

- `create-from-url` answers 400 for a URL with another scheme, with
  credentials, or whose host resolves to a loopback, private, shared,
  link-local, unique-local, unspecified, multicast or reserved address, and
  never opens a connection for it. The same holds for every redirect hop.
- A public image URL still produces a file row; `/generate` still stores the
  host's generated image; the checkout observer pipeline still calls the API.
- A download stops with 400 when it exceeds `OUTBOUND_URL_MAX_RESPONSE_BYTES`
  or `OUTBOUND_URL_TIMEOUT_MS`.
- An operator reaches further internal services by listing their origins in
  `OUTBOUND_URL_ALLOWED_ORIGINS`, set through the deployer like any other API
  variable.

Verification: the unit specs listed under each phase, a mutation check that
removes the guard, and an HTTP run on port 4307 (public image stored and
deleted; loopback and private URLs refused with 400).

### Key Discoveries:

- `getHttpErrorType` answers `Validation error. ...` with 400
  (`http-error/paterns/index.ts:76-81`); the handler already routes errors
  through it (`create-from-url/index.ts:99-102`). Refusal messages must avoid
  the words other categories match first (`not found`, `server error`,
  `permission`, `authentication`, `unauthorized`).
- The API runs Bun 1.2.5 from `node_modules`, where `BlockList.check` from
  `node:net` matches nothing. The guard therefore compares address bytes
  against its own range table, with an IPv4 address in its IPv4-mapped form,
  and removes a zone index before the check. Jest runs under Node, so only the
  HTTP run exercises the production runtime.
- Bun's `node:dns` lookup does not share `fetch`'s DNS cache, so `fetch` would
  resolve the name again after the check. Bun sends a caller-supplied `Host`
  header to an IP URL, so a plain-HTTP request can go to the address that
  passed the check. An `https` request keeps its hostname: certificate
  verification refuses a certificate that does not match it.
- An IPv6 address must be assigned to `URL.hostname` with brackets; an
  unbracketed assignment is ignored silently in both runtimes.
- `URL.origin` lower-cases and drops default ports, so allowed origins compare
  by exact string.
- Numeric API settings with code defaults that operators may tune are
  registered through the whole deployer chain, as the OAuth lifetimes are
  (`api.sh:36-37,143-144`, `api.env.j2:40-45`).

## What We're NOT Doing

- Authorization of `create-from-url` and of the broadcast routes: #303 and #308.
- Upload validation, type allow-lists and the upload size cap: #304. The cap
  here bounds the download only; #304's cap applies to the stored file.
- The other server-side reads of stored URLs (notification attachments,
  OpenRouter media inlining, chat file reads for `/learn` and transcription).
  They keep their current behavior and are listed in the research as follow-up
  candidates for the same guard.
- The operator secret that checkout writes into observer payloads
  (`checkout.ts:817-819,846-848`). The wrapper only stops it from following a
  redirect to another origin.
- Decoding IPv4 addresses embedded in NAT64 (`64:ff9b::/96`) or 6to4
  (`2002::/16`) prefixes, and binding `https` requests to the checked address.
- Status checks on the fetched response in `create-from-url` (an error page is
  still stored as a file) and rate limiting (#310).
- `apps/api/create_env.sh`: local development needs none of the new values.

## Implementation Approach

One utility folder, `libs/shared/backend/utils/src/lib/outbound-url/`, beside
`rbac-secret` and `http-error`, with a guard (`assertOutboundUrl`) and a fetch
wrapper (`fetchOutboundUrl`) in its `index.ts`. Settings come from
`libs/shared/utils/src/lib/envs/api.ts`. Call sites change one line each. The
allow-list is an environment setting because the internal services a project
adds are deployment facts; the four service URLs are allowed without
configuration so every existing flow keeps working.

Defaults and their reasons:

- `OUTBOUND_URL_TIMEOUT_MS=30000`: one deadline for all hops and the body. The
  observer's pipe steps are API checks that answer in seconds.
- `OUTBOUND_URL_MAX_RESPONSE_BYTES=52428800` (50 MiB): generous for images and
  short videos while bounding the buffer `create-from-url` holds.
- `OUTBOUND_URL_ALLOWED_ORIGINS` empty: the service origins are added in code.
- Redirect limit 5, a constant beside the guard.

## Phase 1: Guard, wrapper and settings

### Overview

Add the settings and the utility with its spec.

### Changes Required:

#### 1. Settings

**File**: `libs/shared/utils/src/lib/envs/api.ts`
**Why**: API process settings live here (`API_SECRET_STRENGTH`).
**Changes**: add `OUTBOUND_URL_ALLOWED_ORIGINS` (raw comma-separated string,
split where used, like `ALLOWED_BILLING_SERVICE_PROVIDERS`),
`OUTBOUND_URL_TIMEOUT_MS` and `OUTBOUND_URL_MAX_RESPONSE_BYTES` with a JSDoc on
what each bounds and its default.

#### 2. Guard and wrapper

**File**: `libs/shared/backend/utils/src/lib/outbound-url/index.ts` (new)
**Why**: backend-only helpers live in this package; both call sites already
import from it.
**Changes**:

- A table of non-public ranges matched on address bytes: `0.0.0.0/8`,
  `10.0.0.0/8`, `100.64.0.0/10`, `127.0.0.0/8`, `169.254.0.0/16`,
  `172.16.0.0/12`, `192.168.0.0/16`, `224.0.0.0/4`, `240.0.0.0/4`, `::`, `::1`,
  `fc00::/7`, `fe80::/10`, `ff00::/8`. An IPv4 address is compared in its
  IPv4-mapped form, so a mapped address meets the IPv4 rules.
- `assertOutboundUrl(url)`: parse (`Validation error. Invalid url` on
  failure), require `http:` or `https:`, refuse a user name or password, pass an
  origin from the allowed list without resolving it, otherwise resolve IP
  literals directly and names with `lookup(..., { all: true })` and refuse when
  there is no answer or any answer is non-public. One message covers both, so
  the answer does not reveal which internal names exist. Returns the parsed URL
  and, for a checked host, the address to connect to (IPv4 preferred).
- The allowed origins are the origins of `API_SERVICE_URL`,
  `NEXT_PUBLIC_API_SERVICE_URL`, `HOST_SERVICE_URL`,
  `NEXT_PUBLIC_HOST_SERVICE_URL` and every entry of
  `OUTBOUND_URL_ALLOWED_ORIGINS`; entries that do not parse are ignored.
- `fetchOutboundUrl(url, init)`: one `AbortSignal.timeout` (combined with a
  caller signal when given) over the whole exchange; per hop, the guard, then
  `fetch` with `redirect: "manual"`. A plain-HTTP hop with a checked address is
  sent to that address with the original `Host` header. A 301/302 after `POST`
  and a 303 after anything but `GET`/`HEAD` continue as `GET` without body or
  body headers; a hop to another origin drops `Authorization`, `Cookie`,
  `Proxy-Authorization` and `X-RBAC-SECRET-KEY`. More than five redirects,
  a declared or streamed body above the cap, and the deadline each end with a
  `Validation error.` message. The result is a `Response` over the bytes read,
  with the original status and headers.

#### 3. Export

**File**: `libs/shared/backend/utils/src/lib/index.ts`
**Changes**: export `assertOutboundUrl` and `fetchOutboundUrl` by name, after
the `rbac-secret` export.

#### 4. Spec

**File**: `libs/shared/backend/utils/src/lib/outbound-url/index.spec.ts` (new)
**Changes**: BDD suites with `node:dns/promises` and `globalThis.fetch`
stubbed and the settings mocked with getters on `@sps/shared-utils`:

- every refused range by IP literal, including the metadata address, the
  mapped and numeric forms of loopback, and the range boundaries that stay
  public (`172.15.255.255`, `172.32.0.1`, `100.63.255.255`, `100.128.0.1`);
- a name answering with a private address, with a mix of public and private
  addresses, with a zone-indexed link-local address, and with no answer;
- non-public and public answers in the other forms a resolver writes: in
  full, with a dotted IPv4 tail, in hexadecimal groups and in upper case;
- `file:`, `s3:`, `data:` and `ftp:` URLs, credentials, an unparsable URL;
- the four service origins passing without a lookup even when they would
  resolve to private addresses, listed origins passing, and the same host on
  another port refused;
- the wrapper: plain HTTP sent to the checked address with the `Host` header,
  HTTPS sent by name, a redirect to a private address refused before a second
  request, a redirect to a public address followed, method rewriting on
  303 and preservation on 307, credential headers dropped across origins and
  kept within one, the redirect limit, the size cap by header and by stream,
  and the deadline.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/backend-utils:jest:test` passes with the new suite.
- [x] `npx nx run @sps/backend-utils:eslint:lint` and `npx nx run @sps/shared-utils:eslint:lint` pass.
- [x] `npx tsc --noEmit -p libs/shared/backend/utils/tsconfig.json` and `-p libs/shared/utils/tsconfig.json` pass.

#### Manual Verification:

- [x] Mutation: with the address check disabled the refusal specs fail; restored afterwards.

---

## Phase 2: Call sites

### Overview

Route both call sites through the wrapper and cover each with a spec.

### Changes Required:

#### 1. `create-from-url`

**File**: `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create-from-url/index.ts`
**Why**: `:35` fetches the caller's URL.
**Changes**: call `fetchOutboundUrl(data.url)` instead of `fetch(data.url)`;
nothing else changes.

**File**: `.../create-from-url/index.spec.ts` (new)
**Changes**: handler spec with the real `getHttpErrorType` and guard, the
storage provider, `file-type`, `image-size`, DNS and `fetch` stubbed:
loopback, metadata and `file:` URLs answer 400 with no request, upload or row;
a public image URL is fetched at its checked address and stored with 201; a
URL on the host service origin (`/generate`) is fetched as given.

#### 2. Observer pipeline

**File**: `libs/middlewares/src/lib/observer/index.ts`
**Why**: `:249` fetches `pipe[].url` from a stored message.
**Changes**: call `fetchOutboundUrl(pipe[index].url, options)` instead of
`fetch`; nothing else changes.

**File**: `libs/middlewares/src/lib/observer/index.spec.ts` (new)
**Changes**: `executePipeline` spec with the broadcast SDKs, DNS and `fetch`
stubbed: a step to the metadata address sends nothing and keeps the message; a
checkout step under `NEXT_PUBLIC_API_SERVICE_URL` (internal `http://api:4000`)
is sent with its headers and deletes the message after a 2xx.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/file-storage:jest:test` and `npx nx run @sps/middlewares:jest:test` pass.
- [x] `npx nx run @sps/file-storage:eslint:lint` passes; `npx eslint` on the changed observer files passes.
- [x] `npx tsc --noEmit -p` for `libs/modules/file-storage` and `libs/middlewares` passes.

#### Manual Verification:

- [x] Mutation: with both call sites back on plain `fetch`, the refusal specs fail; restored afterwards.

---

## Phase 3: Deployer registration and documentation

### Overview

Make the three settings settable in deployments and document them.

### Changes Required:

#### 1. Deployer chain

**Files**: `tools/deployer/.env.example`, `tools/deployer/api.sh`,
`tools/deployer/github_deployer.sh`, `.github/workflows/ansible.yml` (preview
and production arrays), `tools/deployer/api/api.env.j2`
**Why**: operator-set API variables pass through this chain
(`RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS` is the model).
**Changes**: the three variables after `ALLOWED_BILLING_SERVICE_PROVIDERS` in
each file; the template renders each only when set, so the code default
applies otherwise. `.env.example` explains the allow-list format (origins,
comma-separated, no spaces, because the CI step keeps only the first
space-separated token).

#### 2. README

**File**: `libs/modules/file-storage/models/file/README.md`
**Changes**: a section on creating a file from a URL: what the route accepts,
what it refuses, the three settings in a table, and that the observer pipeline
applies the same rules.

### Success Criteria:

#### Automated Verification:

- [x] `bash -n` on the changed shell scripts passes; the template renders with and without the variables.
- [x] `npx prettier --check` on the changed Markdown and YAML files passes.

---

## Phase 4: HTTP verification

1. Boot the API from the worktree on port 4307.
2. `create-from-url` with a public image URL answers 201; delete the row, which
   deletes its file.
3. `create-from-url` with `http://127.0.0.1:4307/`, with a private address and
   with a `file:` URL answers 400.
4. Two throwaway observer messages triggered by `create-from-url`: a step to
   the metadata address is not sent and its message stays; a step on the API
   origin runs and its message is deleted. Delete what remains.
5. Stop the server; `git status` shows no stored file left behind.

## Testing Strategy

### Unit Tests:

- The guard and the wrapper as listed in Phase 1, deterministic through the DNS
  and `fetch` stubs.
- Both call sites as listed in Phase 2, each with a refused and an allowed case.

### Integration Tests:

- The HTTP run in Phase 4 against the Bun release the API runs, which is the
  only check of the range matching and the `Host` header path in that runtime.

### Use cases that keep working:

- MCP content management with public image URLs: the Phase 2 handler spec and
  the Phase 4 run.
- `/generate` through the host service origin: the Phase 2 handler spec (the
  host app does not start on the shared `node_modules`).
- The checkout observer pipeline under the API's own origin, locally
  (`http://localhost:4000`) and deployed (`http://api:4000`, the public API
  domain): the Phase 1 origin cases and the Phase 2 observer spec.
- Public hosts that redirect (for example to HTTPS or a CDN): the Phase 1
  redirect case.
- Local development against a tunnel: the tunnel URL is set as
  `API_SERVICE_URL` or `NEXT_PUBLIC_*`, which the guard allows; direct uploads,
  cross-origin API access, the anonymous cart and MCP OAuth use code paths this
  change does not touch.

## Performance Considerations

One DNS lookup per hop for hosts outside the allowed origins. The body is read
into memory as before, now capped.

## Migration Notes

Downstream projects whose observer pipelines or `create-from-url` callers reach
an internal service other than the API and the host must list that origin in
`OUTBOUND_URL_ALLOWED_ORIGINS`; otherwise those requests are refused with 400
(`create-from-url`) or logged and skipped (observer).

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-307.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-307.md`
