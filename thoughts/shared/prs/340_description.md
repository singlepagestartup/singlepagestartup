Closes #310.

## Summary

Nothing limited how often a client could try a password, ask for a reset code, open a session or present an operator secret. Login answered an unknown address and a wrong password with different messages and in different times (about 90 ms against 178 ms locally, because only the wrong-password path ran bcrypt), forgot-password answered 404 for an unknown address and 201 for a known one, and a wrong operator secret was neither logged nor counted.

The authentication routes now spend attempts from budgets kept in the KV store and answer a caller over a budget with 429 and `Retry-After`. Every wrong operator secret is logged and counted per client address. Login and forgot-password give an unknown account the same answer as a known one.

## Changes

- `libs/shared/backend/utils/src/lib/rate-limit/` (new): `createRateLimiter` keeps fixed-window counters through the KV provider's `incr` with a one-window TTL, the primitive of the HTTP cache version counters, so every API process spends one budget. A store that rejects or does not answer within `KV_COMMAND_TIMEOUT_MS` reports nothing and the request goes through; failures are logged at most once a minute. `assertWithinRateLimit` sets `Retry-After` and throws a 429 `HTTPException`, which the exception filter answers in the standard error shape.
- `libs/shared/backend/utils/src/lib/client-address/` (new): `readClientAddress` returns the `X-Forwarded-For` entry `RBAC_RATE_LIMIT_TRUSTED_PROXIES` hops left of the connection address, which Bun reports through Hono's `env`; `isPrivateNetworkAddress` recognises loopback, RFC 1918, link-local, `100.64.0.0/10` and the IPv6 local ranges. Both helpers live in `@sps/backend-utils` because the rbac package cannot import `libs/middlewares`.
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-rate-limit/` (new): `RequestRateLimit` spends one attempt per request from an address budget and, where the route names an account in its `data` form value, from an account budget, before the handler runs. The subject controller adds it to seven existing routes and changes nothing else:

| Route                                      | Counted per             | Default budget per minute |
| ------------------------------------------ | ----------------------- | ------------------------- |
| login                                      | client address, `login` | 20, 10                    |
| forgot-password                            | client address, `email` | 20, 10                    |
| registration, reset-password, wallet login | client address          | 20                        |
| `init`, `refresh`                          | client address          | 60                        |

- `libs/middlewares/src/lib/operator-secret-attempts/` (new): `OperatorSecretAttemptsMiddleware`, registered in `apps/api/app.ts` before the HTTP cache, the action logger and is-authorized. A wrong secret in the header or the cookie writes one warning (`Operator secret mismatch` with method, path, client address and request id, never the value) and spends one of the address's 10 attempts per minute. Within the budget the request continues to the usual authorization; over it, every request from that address that presents a secret, the right one included, answers 429 until the window ends. A right secret only reads the counter.
- Neither middleware counts a private network address; account budgets still apply to it. The API's own calls and the other services reach the API on the swarm network, and on the default deployer the swarm ingress address stands in for every browser (see Notes).
- `libs/modules/rbac/models/identity/backend/app/api/src/lib/service/singlepage/index.ts`: an unknown address, an identity without a salt and a wrong password throw the same `Authentication error. Invalid credentials` (401) from one statement after one bcrypt round each; the unknown path hashes with a cost-10 salt generated once per process.
- `.../authentication/email-and-password/forgot-password.ts`: every address gets `201 { data: { ok: true } }` from one constant; a code is stored only for exactly one identity linked to a subject.
- `libs/shared/utils/src/lib/envs/rbac.ts`: `RBAC_RATE_LIMIT_ENABLED`, `RBAC_RATE_LIMIT_WINDOW_IN_SECONDS`, `RBAC_RATE_LIMIT_TRUSTED_PROXIES`, `RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ADDRESS`, `RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ACCOUNT`, `RBAC_RATE_LIMIT_SESSION_ATTEMPTS_PER_ADDRESS` and `RBAC_RATE_LIMIT_OPERATOR_SECRET_FAILURES_PER_ADDRESS`, passed through `tools/deployer/api.sh` and `api.env.j2` when set and listed in `tools/deployer/.env.example`. The subject README documents them under "Rate limits".
- `libs/modules/rbac/jest.config.ts`: the ignore that skipped every spec under `authentication/email-and-password` names only the two placeholder specs there, so the new forgot-password spec runs.

`hono-rate-limiter` stays unused: its store contract needs `decrement`, which the KV provider lacks, its default refusal is plain text outside the error shape, and a store error fails the request.

## Verification

- [x] `npx nx run @sps/rbac:jest:test`: 84 suites, 396 tests.
- [x] `npx nx run @sps/middlewares:jest:test`: 11 suites, 72 tests.
- [x] `npx nx run @sps/backend-utils:jest:test`: 8 suites, 167 tests.
- [x] `npx nx run @sps/shared-utils:jest:test`: 12 suites, 74 tests; `npx nx run api:jest:test`: 2 suites, 4 tests.
- [x] `npx nx run-many --target=eslint:lint --projects=@sps/backend-utils,@sps/shared-utils,@sps/rbac,api` (two warnings in untouched api jest configs), and `npx eslint` on the new `libs/middlewares` files, a project without a lint target.
- [x] `npx tsc --noEmit -p` on `libs/shared/backend/utils`, `libs/shared/utils`, `libs/middlewares` and `libs/modules/rbac`: 0 errors. `apps/api/tsconfig.json` reports 25 errors in 16 files this branch does not touch.
- [x] `node tools/agents/code-placement.mjs`.
- [x] 22 mutation checks: bending each guard (trusted hops, private networks, window key, fail-open, `Retry-After`, address and account budgets, letter case, the switch, the wrong-secret count, log and right-secret refusal, the equal login message, the bcrypt round on the unknown path, the forgot-password answer) fails its spec.
- [x] HTTP proof on the worktree API against local PostgreSQL and Redis, client addresses sent as `X-Forwarded-For` the way Traefik sets it:

| Probe                                                | Before                                       | After                                                                                                   |
| ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| login, unknown email / wrong password                | 401 / 401, different messages, 90 / 178 ms   | 401 / 401, same message, stack and cause, 69 / 64 ms                                                    |
| failed logins from one address                       | no limit (30 of 30 answered 401)             | 20 × 401, then 429 with `Retry-After`                                                                   |
| 11 wrong passwords for one account from 11 addresses | no limit                                     | 10 × 401, then 429                                                                                      |
| forgot-password, unknown / known address             | 404 / 201                                    | 201 / 201, same body                                                                                    |
| 61 `init` calls from one address                     | no limit                                     | 60 × 201, then 429                                                                                      |
| wrong operator secrets                               | 200 on an allow-listed route, nothing logged | 10 × 200, then 429; 11 warnings without the value; right secret from that address 429, from another 200 |
| 25 failed logins from `localhost`                    |                                              | 25 × 401 (private address, not counted)                                                                 |
| `RBAC_RATE_LIMIT_SESSION_ATTEMPTS_PER_ADDRESS=3`     |                                              | 3 × 201, then 429                                                                                       |
| `RBAC_RATE_LIMIT_ENABLED=false`                      |                                              | no 429 and no counter; wrong secrets logged                                                             |

Counters carried a TTL under 60 s and expired on their own; the fixtures were deleted afterwards.

## How to verify it

1. Start the API and send 21 failed logins with `X-Forwarded-For: 203.0.113.10`: the last one answers 429 with `Retry-After`.
2. Log in with an unknown email and with a wrong password for an existing one: both answer 401 with the same `error`.
3. Send a wrong `X-RBAC-SECRET-KEY`: the API log shows `Operator secret mismatch` with the path and the address, without the value.

## Notes

- **Deployment.** Per-address budgets need the client address to reach the API. The deployer publishes Traefik through the swarm routing mesh, which gives every connection the ingress address, and creates the Cloudflare records proxied, so on a default deployment every browser request arrives from one private address. The private-network rule keeps that from becoming one shared budget. Per-address budgets apply once Traefik is published with `mode: host` (`RBAC_RATE_LIMIT_TRUSTED_PROXIES=1`) or, with Cloudflare in front, once Traefik also trusts Cloudflare's ranges (`=2`). Account budgets, the uniform answers and the secret log work on every topology. This PR does not change the Traefik template.
- Anyone can spend an account budget: ten wrong passwords in a minute keep the owner out of that route until the window ends, for as long as the attempts continue.
- The operator-secret budget refuses the right secret too, so an operator behind the same public address as an attacker, or a browser holding a rotated secret in `rbac.secret-key`, gets 429 until the window ends.
- `init` stays a `GET`: its only caller is a `useQuery` in `init-default`, and a host built before a change to `POST` would call a missing route until redeployed. The per-address budget bounds subject creation instead.
- Registration keeps answering `Identity already exists` for a taken address; confirming the address is #280. Forgot-password does two lookups and one update more for a known address than for an unknown one; both budgets bound how often that difference can be measured, and the reset mail is not sent today.
- #311 edits the same controller route table. This PR only adds `middlewares` to existing entries and will be rebased once #311 merges.
- The branch carries the research, plan, process and progress records under `thoughts/shared/`.

## Downstream migration

Adaptation is required where a project rebinds the authentication routes, matches the old login or forgot-password answers, calls these routes or presents the operator secret at high rates from one public address, or runs behind a proxy chain other than one Traefik.

**Actions:**

- Where a startup subject controller rebinds init, refresh, registration, login, forgot-password, reset-password or the wallet login, copy the `RequestRateLimit` entries from the singlepage controller onto those routes.
- Replace checks for `Not Found error. Invalid credentials`, `Validation error. Invalid credentials`, `No salt found for this identity` or a forgot-password 404 with the single 401 `Authentication error. Invalid credentials` and the uniform 201.
- Set `RBAC_RATE_LIMIT_TRUSTED_PROXIES` to the number of proxies that append to `X-Forwarded-For`; publish Traefik with `mode: host` where per-address budgets should apply behind the routing mesh.
- Raise the `RBAC_RATE_LIMIT_*` budgets for integrations that legitimately exceed them from one public address, set `RBAC_RATE_LIMIT_ENABLED=false` for load tests, and replace stale operator secrets held by browsers and integrations.

**Verify:** run the rbac, middlewares and backend-utils unit lanes; send 21 failed logins from one public `X-Forwarded-For` address and expect 429 with `Retry-After` on the last; send a wrong `X-RBAC-SECRET-KEY` and find `Operator secret mismatch` in the API log without the value.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
