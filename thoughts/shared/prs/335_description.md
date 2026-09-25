Closes #307.

## Summary

`create-from-url` and observer pipeline steps passed a URL from the request, or from a stored broadcast message, straight to `fetch`. The API followed its redirects and read the whole body without a deadline, from inside the network it shares with the database, the cache and the other services. Under Bun the same `fetch` also reads `file:` URLs from disk and signs `s3:` URLs with the process credentials.

Both call sites now go through one guard in `@sps/backend-utils`. A URL passes when it is `http` or `https`, carries no credentials, and either sits on one of the deployment's own origins (the API and host service URLs, plus any origin listed in `OUTBOUND_URL_ALLOWED_ORIGINS`) or names a host that resolves to public addresses only. Every redirect hop is checked again, and the exchange stops after `OUTBOUND_URL_TIMEOUT_MS` (30 s) or `OUTBOUND_URL_MAX_RESPONSE_BYTES` (50 MiB). A refused URL answers 400 in `create-from-url` and is logged and skipped by the observer.

The API's own flows keep working because their targets are service origins. The checkout observer calls `NEXT_PUBLIC_API_SERVICE_URL`, `/generate` downloads the host's image from `HOST_SERVICE_URL` (`http://host:3000` in deployment), and MCP content management sends public image URLs.

## Changes

- `libs/shared/backend/utils/src/lib/outbound-url/index.ts` (new): `assertOutboundUrl` and `fetchOutboundUrl`, exported from `@sps/backend-utils`.
  - Refused ranges: loopback, private (10/8, 172.16/12, 192.168/16), shared (100.64/10), link-local including `169.254.169.254`, this network, multicast, reserved and broadcast, and the IPv6 unspecified, loopback, unique-local, link-local and multicast ranges. IPv4-mapped IPv6 addresses meet the IPv4 rules.
  - Ranges are matched on address bytes. `BlockList` from `node:net` matches nothing in Bun 1.2.5, the release the API runs from `node_modules`.
  - Redirects are followed by the wrapper: every location is checked; a 303, and a 301 or 302 after a POST, continue as GET; `Authorization`, `Cookie`, `Proxy-Authorization` and `X-RBAC-SECRET-KEY` are dropped on a redirect to another origin.
  - A plain-HTTP request is sent to the address that passed the check, with the original `Host` header, so a second DNS answer cannot redirect it. HTTPS keeps the name, and certificate verification covers it.
  - A host that does not resolve gets the same message as one that resolves privately.
- `libs/shared/utils/src/lib/envs/api.ts`: `OUTBOUND_URL_ALLOWED_ORIGINS` (empty), `OUTBOUND_URL_TIMEOUT_MS` (`30000`), `OUTBOUND_URL_MAX_RESPONSE_BYTES` (`52428800`).
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create-from-url/index.ts` and `libs/middlewares/src/lib/observer/index.ts`: `fetchOutboundUrl` instead of `fetch`. Prettier re-indents the observer's `.then` block; ignoring whitespace, each file changes one import and one call.
- Specs: `outbound-url/index.spec.ts` (70 cases), `create-from-url/index.spec.ts` (6), `observer/index.spec.ts` (3).
- Deployer: the three variables in `tools/deployer/.env.example`, `api.sh`, `github_deployer.sh`, `api/api.env.j2` (rendered only when set) and `.github/workflows/ansible.yml`.
- `libs/modules/file-storage/models/file/README.md`: "Create from a URL" section with the rules and the settings.
- `thoughts/shared/`: research, plan, process log and implementation progress for #307.

Framework layer only: no `startup` file, no schema change and no new dependency. Authorization of these routes and upload validation are unchanged (#303, #308, #304).

## Verification

- [x] `npx nx run @sps/backend-utils:jest:test`: 7 suites, 196 tests.
- [x] `npx nx run @sps/middlewares:jest:test`: 11 suites, 67 tests.
- [x] `npx nx run @sps/file-storage:jest:test`: 3 suites, 12 tests.
- [x] `npx nx run @sps/backend-utils:eslint:lint`, `@sps/shared-utils:eslint:lint`, `@sps/file-storage:eslint:lint`, and `npx eslint` on the observer files.
- [x] `npx tsc --noEmit -p` for `libs/shared/backend/utils`, `libs/middlewares`, `libs/modules/file-storage`, `libs/shared/utils`: 0 errors.
- [x] `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- [x] Mutation checks, each restored afterwards. Disabling the address check fails 33 of 70 guard cases; comparing IPv4 without the mapped-form offset fails 21; skipping the per-hop check fails 3; sending plain HTTP by name fails 2; keeping credential headers across origins fails 1. Putting both call sites back on `fetch` fails every refusal case there, while the allowed flows still pass.
- [x] HTTP run against the API on port 4307 under its own runtime (`node_modules/bun`, 1.2.5). Stored with 201: public HTTPS image, public image behind a redirect, public plain-HTTP image, and a file on the API's own origin. Refused with 400 and the guard's message: `127.0.0.1:4307`, `localhost:5433`, `10.0.0.1`, `192.168.1.1`, `169.254.169.254`, `[::1]:4307`, `file:///etc/hostname`, and a URL with credentials. The log shows no request reaching the API through a loopback address. All records were deleted.
- [x] Observer run on the same API with two throwaway messages. The step to the metadata address was not sent and its message stayed; the step on the API origin ran and its message was deleted. Both leftovers were deleted.
- [x] `bash -n` on the changed shell scripts, the workflow YAML parses, and `api.env.j2` renders the three lines only when they are set.

## How to verify it

1. Start the API and call `POST /api/file-storage/files/create-from-url` with `data={"url":"https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"}`: 201.
2. Repeat with `http://127.0.0.1:<api port>/`, `http://169.254.169.254/latest/meta-data/` and `file:///etc/hostname`: 400 each, with no outgoing request.
3. Run a checkout end to end: the observer pipeline still calls the order and subject checks and deletes its messages.

## Notes

- Defaults: 30 s and 50 MiB bound one download. #304 adds its own cap on stored uploads; if it chooses a smaller figure, the two settings can be aligned there.
- The unit lane runs under Node, where `BlockList` works. Only the HTTP run exercises Bun 1.2.5, which is how the byte matching became necessary. The process log records this.
- Not covered: IPv4 addresses embedded in NAT64 or 6to4 prefixes are not decoded, and HTTPS requests are not bound to the checked address.

## Downstream migration

Adaptation is required where a project's server-side requests reach internal services, download large or slow files, or where a project keeps its own deployer scripts.

**Applies to:** projects whose observer pipelines or `create-from-url` callers reach an internal service other than the API and host service URLs; projects that download files above 50 MiB or slower than 30 seconds; projects that keep their own copies of the deployer scripts; projects whose own server code fetches URLs taken from requests or stored data.

**New environment variables:**

| Variable                          | Default    | Meaning                                                                                                     |
| --------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `OUTBOUND_URL_ALLOWED_ORIGINS`    | empty      | Further origins the API may reach although they resolve to non-public addresses, comma-separated, no spaces |
| `OUTBOUND_URL_TIMEOUT_MS`         | `30000`    | Deadline for one outbound request, redirects and body included                                              |
| `OUTBOUND_URL_MAX_RESPONSE_BYTES` | `52428800` | Largest response body read                                                                                  |

**Actions:**

- List each internal origin those requests need (scheme, host and port, for example `http://crm:8080`) in `OUTBOUND_URL_ALLOWED_ORIGINS` in the API environment and the deployer `.env`. Raise the timeout or the size cap where larger or slower downloads are expected.
- In project-owned deployer copies, pass the three variables through `tools/deployer/api.sh`, `tools/deployer/github_deployer.sh`, `.github/workflows/ansible.yml` and `tools/deployer/api/api.env.j2` as the framework files do.
- Route project server code that fetches a URL taken from a request or stored data through `fetchOutboundUrl` from `@sps/backend-utils` instead of `fetch`.

**Verify:** against the running API, `create-from-url` with a public image URL answers 201 and with `http://127.0.0.1:<api port>/` answers 400; after a checkout, the observer pipeline still deletes its messages.
