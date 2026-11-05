# PR #328: main integration and security review

Review date: 2026-11-05. PR: #328, issue #319.
Base: `9e06cabad7b5f34530c92b24ea8cd83bbe78bc3c` (main, including merged #327).
Original PR head: `83a61e5860c5ed4a556715e025148cb8adfb35a7`.

Recommendation: keep this PR open until the credential exposure findings below
are addressed. The merge conflicts are resolved and the tested execution paths
pass. The security findings remain open; this review does not deploy changes.

## Findings

### P1: generated credential files permit other local users to read them

`tools/deployer/create_inventory.sh:89-103` writes the SSH password to a new
inventory without setting its permissions. With umask 022, the actual script
created a mode 0644 inventory containing the synthetic password. Anyone who can
traverse the parent directory and read files as another local user can recover
that SSH credential. This is an existing deployer weakness in the code under
review, not a new consequence of SSH host-key verification.

The API environment has the same problem: the template task at
`tools/deployer/api/create_api.yaml:38-44` specifies no mode. Executing that task
against a fresh local destination with only synthetic values produced a mode
0644 file containing the operator credential. Host, MCP and Telegram environment
template tasks also omit modes; their fresh-file permissions were not separately
reproduced. Existing files with restricted permissions may retain those modes.

Correction: create inventory privately from the start (umask 077 and restrictive
permissions for existing output), and declare owner/group and mode 0600 for
server credential files. Check parent-directory access. The reproductions used
temporary destinations; current production permissions were not inspected.

### P2: the new access log records sensitive URL query parameters

`tools/deployer/traefik/docker-compose.traefik.yaml.j2:15-17` enables access logs
and removes header values, but retains query parameters. An isolated container
using the same `traefik:v3.7` image and these flags recorded synthetic OAuth
`code` and `state` in `RequestPath`, including on a 404 response. The Authorization
header was absent, as intended. The application's OAuth callback reads these
parameters in `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/oauth/callback.ts`.

Readers or collectors of these logs receive authorization codes and other
sensitive URL parameters. Their ability to redeem a code also depends on expiry,
single-use checks and the surrounding OAuth flow; this test did not demonstrate
account takeover. The logging exposure occurs for every such request while
access logging is enabled.

Correction: add `--accesslog.fields.queryparameters.defaultmode=drop`. A second
container with this flag logged the path without either synthetic value.
Traefik documents this separate setting in its
[access-log configuration](https://doc.traefik.io/traefik/reference/install-configuration/observability/logs-and-accesslogs/).
The production template has not been changed by this review.

### P2: the cron credential remains visible in process arguments

`tools/deployer/api/set_cron_jobs.yaml:17-19` embeds the credential in `curl -H`.
A local curl call using the same argument shape exposed the synthetic value in
`ps`. Local users able to inspect process arguments can copy that key and call
the dispatcher. It is scoped to cron, unlike the previous operator credential,
but is still a reusable authorization credential. `no_log: true` hides Ansible
output; it does not alter curl's arguments. The exposure recurs each minute for
the lifetime of the curl process. Linux process visibility can be restricted by
the host's procfs policy, which was not inspected on production.

Correction: write a root-owned 0600 curl config/header file and have cron pass
only its path. Set request/connect timeouts so stalled connections cannot
accumulate indefinitely. Review the deployer's own Ansible `-e` argument
transport separately: `api.sh` also passes credentials on its command line.

## Integration and verification

Three conflicts were resolved by retaining both sides' required behavior:
the AgentRun and RequestCanRunCron middleware exports, cron concurrency/timeouts
and AGENT_CRON_SECRET, and both cron and Host revalidation deployment docs.

- Agent: 22 suites, 126 tests. Nine new routing tests compose the effective
  startup controller with global authorization and the actual cron guard.
  Dispatcher domain services are mocked to avoid executing scheduled jobs.
  Cron/operator credentials reach the dispatcher; missing/wrong credentials
  and an unrelated bearer token do not. The cron key cannot call POST dummy or
  GET cron. Existing dispatcher and completion-marker tests pass.
- Backend Utils: 9 suites, 170 tests. Middlewares: 12 suites, 61 tests.
- TypeScript checks for Agent, Backend Utils and Middlewares pass. Scoped ESLint
  passes with `--parser-options '{"project":null}'`; type-aware ESLint exhausted
  its default 4 GiB heap, so TypeScript was checked separately. The scoped run
  found a duplicate middleware import introduced by the merge; it is consolidated.
  Shell syntax and module dependencies pass (zero dependency violations).
- The repository-wide placement check reports an existing Studio collision:
  `apps/studio/workspace/design/singlepage/interface-kit/Files.tsx` beside `Files/`.
  Both paths are present in main and are unchanged by this PR.
- Six deployer playbooks pass Ansible syntax checks. API, Host, MCP, Telegram
  and Traefik Jinja templates render with synthetic values and pass Compose config.
- An isolated SSH server with key A accepts two connections using accept-new.
  After replacing its key with B, the client refuses the connection (exit 255).
  No production host keys or known_hosts entries were changed.
- The cron template removes curl's TLS verification bypass and uses the scoped
  credential. The expected security-header labels survive template rendering;
  browser responses from a deployed Swarm were not tested.

## Deployment limits

`AGENT_CRON_SECRET` must be set in the deployer and the relevant production or
preview GitHub secrets before the next API deployment. The new `api.sh` refuses
an empty value. An image update alone does not install the new cron or headers.

The default GitHub-hosted runner has no prior known_hosts entry. Accept-new
therefore does not authenticate the first server key on each fresh runner;
preload a verified key for that protection. This is documented by the PR and
remains an explicit limitation, not a successfully tested CI pinning mechanism.

This is a focused review of the cron, SSH and edge/deployer changes and their
credential handling. It is not a whole-repository or live-production security
audit, and it does not establish that the system has never been compromised.
