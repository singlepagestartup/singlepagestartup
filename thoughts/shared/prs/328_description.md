Closes #319.

The server crontab used to send the operator credential to the public API with
TLS verification disabled. It now sends an empty HTTPS POST and checks the
certificate. The cron route returns 204 without credentials. Internal worker
routes retain their authorization.

Concurrent ticks reserve work under a short PostgreSQL lock. A handler starts
each reserved run ID once, renews its slot until completion, and can outlive
the dispatch HTTP timeout. The Broadcast Message service stores the payload on Message and the delivery key, receipt and lease on the channel-to-message relation. Completed runs keep their schedule across ordinary message expiry.

### Traefik (`5fdbc85ef1`)

- `tools/deployer/traefik/docker-compose.traefik.yaml.j2`: `--accesslog=true`, `--accesslog.format=json`, `--accesslog.fields.headers.defaultmode=drop`, and `json-file` rotation at 10 MB x 3.
- `tools/deployer/{api,host,mcp,telegram}/docker-compose.*.yaml.j2`: each router attaches `<service>-security-headers`, defined in the same labels with `stsseconds=31536000`, `contenttypenosniff=true` and `referrerpolicy=strict-origin-when-cross-origin`.
- Deployer README section "Traefik access log and security headers".

### SSH host keys (`483dcfed65`)

- `tools/deployer/ansible.cfg`: `host_key_checking = True`.
- `tools/deployer/create_inventory.sh` and both inventory examples: `-o StrictHostKeyChecking=accept-new` without `-o UserKnownHostsFile=/dev/null`.
- Deployer README: first connection, rebuilt servers (`ssh-keygen -R`), CI runners.

API errors preserve their category and HTTP status through the SDK. Failed sign-in returns the same 401 for an unknown email or incorrect password. The Host shows one error toast for a failed action, and a stale delivery receipt stays a conflict.

## Downstream migration

Run `npx nx run api:db:migrate` before starting queue workers and drain older workers during rollout. Replace credential-bearing cron entries with an empty HTTPS POST to `/api/agent/agents/cron` by rerunning `./api.sh up` in the deployer. Remove obsolete cron secrets from project-owned scripts. Keep the internal worker credential server-side. Check custom error handlers that match message text, and use the HTTP status and framework category instead. Check custom proxy headers, secret file permissions and SSH host verification against the deployer guidance.

Verify an anonymous tick returns 204, concurrent ticks respect the schedule, and an obsolete receipt returns 409. Check sign-in errors and private channel visibility in any overridden UI.

## Verification

On two local API processes sharing PostgreSQL, bursts of 60 anonymous requests
returned 204. A real order-check handler stayed active past the HTTP timeout,
kept its single test slot and blocked the waiting job. Replaying delivery
returned 409, and calling a worker anonymously returned 403. After the first
job completed, the waiting job could run and the daily job kept its schedule. Recovery on another API process used a new run ID after the worker was killed.

All four agents from the repository ran against a local API and a fresh
PostgreSQL database. With one slot, the first POST ran all four in sequence:
Billing failed an expired payment intent, Ecommerce marked an unpaid order
as `canceling`, RBAC changed it to `canceled`, and the daily cleanup deleted
an inactive anonymous subject while keeping the order owner and a new
visitor. Five more POSTs in the same minute started no work. Three POSTs in
the next minute started only the three minute jobs, once each.

The same requests with the default three slots produced the same seven
worker starts. The RBAC check ran alongside Ecommerce and finished the
cancellation on the next minute's run.

An independent consumer used the Broadcast HTTP API on two replicas. Fourteen
simultaneous publications of the same key produced one message. Twenty reserve
requests produced one receipt. A second reservation rejected the old receipt
and published the completed payload to the channel. PostgreSQL used the key
and expiry indexes with 25,000 ordinary messages in the table. An existing
daily marker kept its schedule after migration and after cleanup deleted 241
expired messages. The server SDK also published to a separate channel.

The Agent, Broadcast and middleware suites and the Agent and Broadcast
TypeScript checks pass. The full API type check reports the same 18 diagnostics as
the earlier baseline. The repository placement check flags the existing Studio
interface-kit Files component.

The final Broadcast schema was installed on an empty database and upgraded from main with an existing message and relation. The next generated model and relation migrations applied successfully in an isolated database. The consistency check covered all 159 resources. Six concurrent HTTP clients published and reserved one job. A browser login and SDK notification tests verified error feedback.

## Open security findings

The Traefik access log can include OAuth query parameters. The generated
inventory and API environment files were readable by other users under the
tested default umask. Both findings are recorded in the security review.
