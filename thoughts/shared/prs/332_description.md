Closes #314.

A production API error previously returned the server stack to the caller and waited for Telegram before responding. A developer now gets a request ID from the failed response and can find the source of the failure on the server, including when Telegram is unreachable.

- Production uses `API_ERROR_DETAILS=brief`. A 5xx exposes its category and request ID; a 4xx retains its categorized validation or permission message. Full responses remain available in private local development or with the operator credential.
- Each handled exception produces a structured `api.error`: route pattern, status, time, safe source locations, verified Subject ID when available, resource UUIDs and related calls. The Social message flow records the processing stage and attachment counts, sizes and MIME families. It excludes message text, filenames, credentials and raw request data. The shared logger records background and repository failures as `runtime.error` without serializing driver arguments.
- The standard Linux deployment stores API output in the node's persistent system journal and checks that a new event reaches disk before replacing the API. Telegram receives at most one concurrent alert per API process. Attempts time out, duplicates are suppressed and failed delivery starts a cooldown. No notifications wait in a queue.
- No API route exposes the journal. The [incident runbook](https://github.com/singlepagestartup/singlepagestartup/blob/claude/issue-314-error-response-contents/tools/deployer/README.md#finding-an-api-error) covers SSH lookup, retention, tracing internal calls and two options for a future admin view.

## Verification

- Sent a malformed multipart message through the real local Social API using a signed test Subject and a real database. The 400 ID matched a Pino event with the verified Subject ID, `message.parse`, `invalid_json`, source locations and attachment metadata. Neither the submitted marker nor the filename appeared in the event. The seven fixture records were removed.
- Exercised the shared SDK over HTTP with a deliberately unresponsive local Telegram endpoint. All 43 incidents were recorded, including 40 parallel requests; one delivery was attempted. Parent and child had distinct request IDs, a common trace and an explicit link. Untrusted callers could not supply those IDs.
- Wrote a tagged event to a Linux systemd journal, removed the writing container, then read the event by ID from a second container with the same volume mounted read-only. Validated the Ansible playbook and rendered deployment templates locally. No production deploy was performed.
- Relevant Jest suites passed, including Social message creation, SDK trace boundaries and logger redaction. The API package still has two pre-existing TS7030 diagnostics in `consistency-cache.spec.ts`.

## Downstream migration

Projects with custom deployers need a private durable log destination, a retention policy and authorized operator access. On Linux/Swarm, adopt the journald driver/tag and the disk probe before rolling out. For multi-node deployments, collect incidents on every node that can host the API. Container replacement preserves only the journal of the node that wrote it.

Keep `API_ERROR_DETAILS=brief` on publicly reachable APIs. Move consumers of production stacks or raw error logs to request-ID lookup. If overriding the shared filter, request middleware, logger or SDK, preserve the structured event contract and verified trace propagation. Existing developer checkouts that need full local responses can set `API_ERROR_DETAILS=full` in the private API environment. For optional Telegram alerts, configure the `BUG_SERVICE_*` variables and set the alert window if the 300-second default is unsuitable.

Verify a brief error against its server event, check a related SDK failure, and exercise the alert timeout with a synthetic endpoint. Raw journals, Docker access and operator credentials belong outside the browser.
