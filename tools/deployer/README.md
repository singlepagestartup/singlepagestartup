# SPS deployer

The deployer provisions a Linux host with Ansible and deploys SPS services to a
Docker Swarm. AWS Lightsail is supported through the same playbooks as other
Ubuntu hosts.

## AWS Lightsail requirements

- Use an Ubuntu 22.04 or 24.04 instance.
- Use an x86_64 instance for a full SPS deployment. The current GitHub Actions
  image workflow publishes an image for the runner architecture only; ARM64
  instances require SPS images to be published as multi-platform images first.
- Attach a static IP address to the instance.
- Allow inbound TCP ports `22`, `80`, and `443` in the Lightsail firewall.
- Download the private key for the instance and restrict its permissions:

  ```bash
  chmod 400 ~/Downloads/LightsailDefaultKey.pem
  ```

The deployer configures the instance. It does not create the Lightsail instance,
static IP, DNS records, or firewall rules.

## Local deployment with an SSH key

Run deployer commands from `tools/deployer` because the service scripts load
their environment files relative to that directory:

```bash
cd tools/deployer
cp .env.example .env
```

Configure these values in `.env`:

```dotenv
ANSIBLE_HOST=203.0.113.10
ANSIBLE_PORT=22
ANSIBLE_USER=ubuntu
ANSIBLE_PRIVATE_KEY_FILE=/absolute/path/to/LightsailDefaultKey.pem
ANSIBLE_PRIVATE_KEY_BASE64=
ANSIBLE_PASSWORD=
```

Generate the inventory and verify SSH access before provisioning:

```bash
./create_inventory.sh
ansible all -m ping
```

Inventory generation restricts the configured private key to mode `0600`,
which is accepted by OpenSSH and prevents accidental group or public access.

The first connection records the server's host key in `~/.ssh/known_hosts`
(`StrictHostKeyChecking=accept-new`), and every later connection must present
the same key; a changed key stops the connection with key and password
authentication alike. After rebuilding a server on the same address, remove its
old entry before deploying:

```bash
ssh-keygen -R 203.0.113.10
# when ANSIBLE_PORT is not 22
ssh-keygen -R '[203.0.113.10]:2222'
```

Then provision the server and deploy all configured services:

```bash
./up.sh
```

To provision only the server prerequisites without deploying the application
services, run `./server.sh up` instead.

Password authentication remains available for other providers by leaving both
private-key variables empty and setting `ANSIBLE_PASSWORD`.

## MCP client configuration

When MCP deployment succeeds, `mcp.sh up` exports a public connection bundle
for OpenCode, Claude Code, Codex, Cursor and VS Code/Copilot under
`.artifacts/mcp-client-configs/<client>`. `MCP_CLIENT_CONFIG_OUTPUT_DIR` selects another
directory, including the GitHub Actions artifact location. Active client files
in the checkout remain unchanged.

The connector name uses the checkout's `origin` repository and the environment:
`<repo-name>-production` or `<repo-name>-preview`. `--repo-name` overrides the
name; deployment repository settings are a fallback when Git context is absent.
The endpoint uses the deployment's actual domain and subdomain.

The deployer validates bundle generation with `--check-clients` before DNS,
image or MCP playbook operations, then writes the bundle after deployment and
GitHub metadata updates succeed. A failed deployment, `mcp.sh down` or a skipped
MCP image does not generate the bundle.

`up.sh` and root `create_env.sh` do not generate client connections. Developers
configure them explicitly after setting their own MCP endpoint. Client
generation runs on Bun 1.3.6 without installing dependencies or logging in.

Use `MCP_CLIENT_OPENCODE_VERSION=auto` to preserve the project's existing
OpenCode format. A new configuration uses the installed client's version, or
V2 when detection is unavailable. `1` and `2` select a new file's format
explicitly. Regenerate without provisioning a server:

```bash
# From the repository root:
npm run mcp:clients:generate -- --client codex
```

GitHub Actions saves an `mcp-client-configs` artifact with public connector
entries after successful MCP deployment. The export excludes existing client
settings and credentials. Local deployment and CI both export a bundle without
changing active client files. `npm run mcp:clients:generate -- --client <client>` explicitly updates that
client's ignored local files; shared `*.example` defaults remain in Git.
Each client still needs the user's OAuth login. See the
[client formats and authentication commands](../../apps/mcp/README.md#generated-project-client-configs).

## Infrastructure security and operations

The default production deployment keeps infrastructure services behind the
Docker Swarm network:

- provider firewall ingress is limited to TCP `22`, `80`, and `443`;
- PostgreSQL `5432`, Redis `6379`, and Portainer `9000` must not be opened;
- PostgreSQL and Redis have no public Traefik TCP routers;
- Portainer is available only through its HTTPS hostname.

The deployer does not create or modify provider or host firewall rules. Keep
SSH access available before tightening firewall policy, and verify the rules in
the provider console before each infrastructure rollout.

### PostgreSQL and Redis administration

Connect to the host over SSH and run administrative tools inside the service
containers. Do not restore public database routes for routine administration.

Find the running PostgreSQL container and open `psql` with the database values
already present in its environment:

```bash
POSTGRES_CONTAINER_ID="$(
  docker ps \
    --filter label=com.docker.swarm.service.name=postgres_postgres \
    --format '{{.ID}}' \
  | head -n 1
)"
docker exec -it "$POSTGRES_CONTAINER_ID" /bin/sh
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"
```

Find the running Redis container and use its protected environment value
through `REDISCLI_AUTH`. Do not place the password directly in a command-line
argument or log:

```bash
REDIS_CONTAINER_ID="$(
  docker ps \
    --filter label=com.docker.swarm.service.name=redis_redis \
    --format '{{.ID}}' \
  | head -n 1
)"
docker exec -it "$REDIS_CONTAINER_ID" /bin/sh
REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -p "${REDIS_PORT:-6379}"
```

`REDIS_PASSWORD` is the single deployment credential. The Redis stack consumes
it as `requirepass`, while API and MCP receive the same protected value as
`KV_PASSWORD`. Keep both production and preview secrets populated and deploy
Redis, API, and MCP as one coordinated rollout when the credential changes.
If Redis is recreated separately, restart its existing clients before testing:

```bash
docker service update --force api_api
docker service update --force mcp_mcp
```

### PostgreSQL roles

The PostgreSQL stack holds two roles:

- `POSTGRES_USER`, the superuser the image creates on the first start of an
  empty `/home/code/postgres_data`. Only the stack receives it, and the
  administration commands above use it.
- `DATABASE_USERNAME`, the role the API connects as, for its requests and for
  the migrations and seed it runs at start. It owns `DATABASE_NAME` and
  everything the migrations create in it. It cannot run programs through
  `COPY ... PROGRAM`, read server files, create databases or roles, or change
  objects it does not own.

On that first start the image runs `apps/db/create_application_role.sh`, which
the PostgreSQL playbook copies to `/home/code/create_application_role.sh` and
the stack mounts into `/docker-entrypoint-initdb.d`. The script creates the
`vector` extension, which only a superuser may create, and the application
role. `apps/db` mounts the same script for local development, where
`apps/db/create_env.sh` writes `POSTGRES_USER=postgres` and the repository name
as `DATABASE_USERNAME`. For a repository named `postgres` or starting with
`pg_`, local bootstrap prefixes the login with `sps_`, for example `sps_postgres`.

Ansible installs `/home/code/docker-compose.postgres.yaml` with owner and group
`root:root` and mode `0600`. Reapplying the play corrects older file permissions
even when the contents match. This file contains both passwords. Configure
distinct passwords for the administrator and the application.

PostgreSQL and API deployment require both credential pairs. The API will
not start and the migration command will not run if the actual database
session is privileged or has role memberships. An existing volume still
needs the [ownership move](#moving-an-existing-installation-to-the-application-role)
before switching the API. The application remains the owner of its database:
it can change or delete application data.

The deployer passes database and RBAC credentials to Ansible through the
controller process environment. In a service script, `. ./ansible_vars.sh` loads
`ansible_with_vars`. The call names the playbook and its variables; Ansible
reads their values from the environment. GitHub and Portainer helpers read their input
from stdin. Their arguments contain no credential values. Use a trusted
controller account: root, Docker administrators and processes running as that
account can still access deployment credentials.

### Local database dump

Run `./apps/db/dump.sh` from the repository root to back up this checkout's
running Compose `db` service. It uses the application login and writes a custom
PostgreSQL archive to `apps/db/db_backups/`. Set `DATABASE_BACKUP_DIRECTORY` to
an absolute path to choose another directory. These private backups are excluded
from Git and Docker builds. A Git commit does not start a backup.

### Nightly database dumps

`./server.sh up` installs `/home/code/create_db_dump.sh` and a root cron job
that runs it at 00:00 server time. The script uses password authentication over TCP on the container network
as `DATABASE_USERNAME` inside the PostgreSQL container. It writes a custom
`pg_dump` archive to `/home/code/db_backups/<DATABASE_NAME>_<dd-mm-yyyy>.dump`.
The archive contains application objects and data. The target bootstrap installs
`vector`; backup and restore omit object grants. Reapply any project-specific
access grants separately from reviewed configuration after recovery.

A dump contains every table, identities and subjects included. The directory is
`0700` and each dump `0600`, both owned by root, and the script also tightens
dumps that an earlier version left readable. A new dump replaces nothing until
`pg_dump` succeeds, and only then are dumps older than
`DATABASE_BACKUP_RETENTION_DAYS` deleted (default `14`; `0` keeps every dump).
Set the retention to 1–9 decimal digits, including `0` to disable pruning.
GitHub Actions uses `DATABASE_BACKUP_RETENTION_DAYS` for production and
`PREVIEW_DATABASE_BACKUP_RETENTION_DAYS` for preview. Ansible checks the value
before editing root's crontab. The cron environment holds the normalized
number and the scheduled command always invokes the same script.
The job appends its output to `/home/code/create_db_dump.log`. Run
`./server.sh up` on an existing server to install the script, the directory
mode and the cron entry. Files that the earlier host-side script left in the
directory are usually empty, because that script could not reach the database.

Keep a copy off the database host for recovery after host loss. To restore:

1. Prepare a separate, empty SPS PostgreSQL container with its own volume and
   both credential pairs. Let the bootstrap install `vector`. Do not connect
   the API or run migrations yet.
2. On the host holding the backup, name the **target** container explicitly:

   ```bash
   /home/code/restore_db_dump.sh "$TARGET_CONTAINER_ID" < "$BACKUP_FILE"
   ```

3. Check the exit status, a known row, sequence values and the application
   schema on the target. Start the API against it only after those checks.

The restore connects as the target application login. `pg_restore` ignores
original ownership and grants, and rolls back the transaction on the first
error. A populated target is refused. A dump can run source-defined SQL
during restore. Use a trusted backup; inspect an unfamiliar archive in a
disposable, isolated environment. Earlier plain SQL dumps cannot be used by
this command. If the source is available, take a new archive. Otherwise keep
the original untouched and plan an isolated recovery; do not replay it as the
database administrator. See [PostgreSQL's pg_restore documentation](https://www.postgresql.org/docs/17/app-pgrestore.html).

### Generating deployment secrets

Every `X`-placeholder credential in `tools/deployer/.env.example` is operator
supplied. The deployer generates nothing; it only transports what it is given.
Produce each one with a cryptographic source and paste the result:

```bash
openssl rand -hex 32
```

That applies to `RBAC_SECRET_KEY`, `RBAC_JWT_SECRET`,
`RBAC_COOKIE_SESSION_SECRET`, `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET`,
`HOST_SERVICE_REVALIDATION_SECRET`, `POSTGRES_PASSWORD`, `DATABASE_PASSWORD`,
`REDIS_PASSWORD`, `TRAEFIK_PASSWORD` and `PORTAINER_PASSWORD`. Do not copy these
values out of a locally bootstrapped `apps/api/.env` into a deployment; generate
fresh ones for each environment, and keep production and `PREVIEW_` sets distinct.

The API refuses to start on a secret it can recognize as guessable. Its
`API_SECRET_STRENGTH` variable defaults to `enforce`, which stops the process
when `RBAC_SECRET_KEY` or `RBAC_JWT_SECRET` is absent or carries the shape of the
generator described below. `API_SECRET_STRENGTH=report` logs the same findings
and starts anyway; it exists for a deployment that cannot rotate in the same
maintenance window, and leaving it set is an explicit decision to keep running
on an authorization bypass that can be found offline. The report names keys and
verdicts only, never a value.

The API deployment uses `API_ERROR_DETAILS=brief`. The client can give the
operator its request ID to locate the incident in the private server journal.
See [Finding an API error](#finding-an-api-error).

The Telegram and MCP services run the same check when they start. They stop on
a legacy `RBAC_SECRET_KEY` or `RBAC_JWT_SECRET` and report a short or legacy
value of their other secrets. A secret a service does not hold is not a finding:
each refuses the operation that needs it. `TELEGRAM_SECRET_STRENGTH=report` and
`MCP_SECRET_STRENGTH=report` start them anyway, with the same consequence as
`API_SECRET_STRENGTH=report`.

### Rotating the secrets of a deployment that already bootstrapped

Until this change, the bootstrap scripts derived every generated credential from
the shell `$RANDOM` variable, which has about fifteen bits of entropy, and wrote
a fixed administrator password. Upgrading does not fix an installation that
already ran them: `apps/api/create_env.sh`, `apps/db/create_env.sh` and
`apps/redis/create_env.sh` all exit early when their `.env` file exists, so a
project that syncs and redeploys still runs on the old values. **The values have
to be rotated by hand.**

On a developer checkout whose data is disposable: stop the `apps/db` and
`apps/redis` stacks, move aside `apps/api/.env`, `apps/db/.env`,
`apps/redis/.env`, `apps/mcp/.env` and `apps/telegram/.env`, remove
`apps/db/db_data` and `apps/redis/redis_data`, then run `./up.sh`,
`npx nx run api:db:seed` and `cd apps/api && bash create_rbac_subject.sh`. Copy
the administrator password the bootstrap prints into `.agents/.env` as
`API_RBAC_SUBJECT_IDENTITY_PASSWORD` if browser tests are run. Keep the data
instead by rotating value by value, as below.

On a deployment that must keep its data, rotate in this order. The two token
secrets end every session, so plan the window.

| Value                                        | What to do                                                                                                                                                                         | Effect                                                                                                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`                          | run `ALTER ROLE "<POSTGRES_USER>" WITH PASSWORD '<new>';` inside the running PostgreSQL container, then update `tools/deployer/.env` and the GitHub secret and redeploy PostgreSQL | Application traffic uses a separate login. Editing the image environment alone does not change the password of an existing role.                     |
| `DATABASE_PASSWORD`                          | update the deployer and GitHub values, pause writers and run `./postgres.sh migrate-role` as in the procedure below, then deploy the API and restore its replica count             | the API cannot open new connections between the script and its redeploy                                                                              |
| `REDIS_PASSWORD`                             | follow the coordinated procedure above: update the secret, deploy Redis, API and MCP as one rollout, then force-update `api_api` and `mcp_mcp`                                     | cache and KV unavailable for the window                                                                                                              |
| `RBAC_JWT_SECRET`                            | rotate in `tools/deployer/.env` and in the GitHub secrets, then deploy API, Telegram and MCP together                                                                              | every access and refresh token is invalidated. It also rotates the MCP OAuth signing key, because the MCP template falls back to this value          |
| `RBAC_SECRET_KEY`                            | rotate in `tools/deployer/.env` and in the GitHub secrets, then deploy API and Telegram                                                                                            | this is the full authorization bypass. The middleware also accepts it from an `rbac.secret-key` cookie, so any browser that received it holds a copy |
| `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET` | rotate and deploy API and MCP together                                                                                                                                             | the API-to-MCP exchange fails until both sides match                                                                                                 |
| `HOST_SERVICE_REVALIDATION_SECRET`           | rotate in `tools/deployer/.env` and in the GitHub secrets, then deploy API and host together                                                                                       | the Host rejects invalidation until both sides match and the outbox retries pending batches                                                          |
| `RBAC_COOKIE_SESSION_SECRET`                 | rotate for hygiene                                                                                                                                                                 | no runtime effect: nothing reads it today                                                                                                            |
| Administrator identity password              | change it through the API or the admin UI, then update `apps/api/.env` and `.agents/.env`                                                                                          | editing `.env` alone does not change the stored bcrypt hash; that value is only the bootstrap input                                                  |

Five copies survive a rotation unless they are handled as well:

- **Docker images.** `.dockerignore` keeps env files, key material and
  `tools/deployer` out of the build context. An image built from a
  bootstrapped checkout with an ignore list that lacks those rules carries the
  old values: rebuild and re-tag it, and treat tags pushed from such builds as
  carrying them.
- **GitHub Actions secrets.** Replace both the production and the `PREVIEW_`
  variants of the four RBAC values.
- **`tools/deployer/.env`** on the operator's own machine.
- **The server crontab.** Run `./api.sh up` to replace an older entry that
  contains credentials with the credential-free trigger.
- **An MCP service env** where `MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK` was
  enabled and `RBAC_SECRET_KEY` added by hand. The deployer does not render the
  secret into the MCP env, so no other MCP copy exists.

Afterwards, treat the window before the rotation as one in which the old
`RBAC_SECRET_KEY` could have been guessed. Review the action log for requests
carrying `X-RBAC-SECRET-KEY` from unexpected sources, confirm the identity and
subject tables hold no account that was not created through a normal flow, and
force password resets if the deployment is public.

#### Moving an existing installation to the application role

**Run the commands below on your deployment workstation, in `tools/deployer`.**
Ansible connects to the database server named in `tools/deployer/.env`. For an
existing Swarm installation the command that changes database ownership is
`./postgres.sh migrate-role`. For a new server, use the normal `./up.sh`;
the PostgreSQL image creates the role when it initializes an empty volume.

**1. Prepare the release and credentials.** Have the new API image ready. In
`tools/deployer/.env`, keep `DATABASE_NAME` and set the following four values.
If you also deploy through GitHub Actions, set the same values in GitHub
Secrets for the target environment (preview uses the `PREVIEW_` prefix).

| Variable            | Value for the existing installation                                                 |
| ------------------- | ----------------------------------------------------------------------------------- |
| `POSTGRES_USER`     | The original database administrator, previously used as `DATABASE_USERNAME`.        |
| `POSTGRES_PASSWORD` | The current password of that administrator, previously used as `DATABASE_PASSWORD`. |
| `DATABASE_USERNAME` | A different, dedicated application login, e.g. `project_api`.                       |
| `DATABASE_PASSWORD` | A new password for that login; generate it with `openssl rand -hex 32`.             |

**2. Open a maintenance window.** Record the desired replica count of the old
API and scale it to zero. You can scale the service in Portainer or use the commands below.
The example uses the default service name `api_api`.
For a custom service name, use the name printed by the listing. Stop any
additional writers on this database. Keep PostgreSQL running. Take a verified
backup or a database-consistent provider snapshot of the existing volume
before proceeding. The new nightly dump command requires the new login and
therefore cannot supply the backup for this first move.

```bash
cd tools/deployer
./create_inventory.sh
ansible all --become -m command -a 'docker service ls --filter label=com.docker.stack.namespace=api'
ansible all --become -m command -a 'docker service scale --detach=false api_api=0'
```

**3. Move and verify the database login.** From the same directory, run:

```bash
./postgres.sh migrate-role
```

This command targets the manager hosting the running `postgres_postgres`
container. It checks the existing data directory, the maintenance window,
and the original administrator credentials before changing the stack. The credential check requires SCRAM or MD5 password authentication on the container network. It then
redeploys PostgreSQL on the **same volume**, waits for it, and runs
`/docker-entrypoint-initdb.d/create_application_role.sh` **inside the updated
container**. The last Ansible task connects over TCP with the new application
password and verifies its privileges and database ownership.

If the role transfer fails, leave the API stopped. The SQL transaction rolls
back its role, password and ownership changes. Review the reported privilege,
choose a dedicated login or correct the unsafe grant, then repeat
`./postgres.sh migrate-role`. A grant to `PUBLIC` also applies to a new login.
Review custom extensions, privileged routines, foreign servers and other
databases the login can reach when upgrading a shared cluster.

For a membership error, an administrator can list grants involving the
proposed login in `psql`:

```sql
\set app_role 'project_api'
SELECT roleid::regrole AS granted_role, member::regrole AS grantee,
       inherit_option, set_option, admin_option
FROM pg_auth_members
WHERE member = to_regrole(:'app_role') OR roleid = to_regrole(:'app_role');
```

The migration transfers ordinary application objects and preserves ownership
of extensions, security-definer routines and routines in untrusted languages.
A refusal names the affected catalog or routine when its grants need review.

**4. Bring the new API online.** After the login check succeeds, deploy the
new API, restore the recorded replica count (the example uses one), and
check its service state:

```bash
./api.sh up
ansible all --become -m command -a 'docker service scale --detach=false api_api=1'
ansible all --become -m command -a 'docker service ps api_api'
```

The new API checks its actual database login before accepting requests.
Confirm the service is healthy and read a known record through the API
before ending the maintenance window.

**Local Compose checkout.** On your workstation, stop the local API, back up
its volume, keep the original `POSTGRES_*` pair in `apps/db/.env`, and add
the new `DATABASE_USERNAME` and `DATABASE_PASSWORD`. From the repository
root, run:

```bash
cd apps/db
docker compose up -d --wait db
docker compose exec -T db /docker-entrypoint-initdb.d/create_application_role.sh
docker compose exec -T db /docker-entrypoint-initdb.d/create_application_role.sh --check-login
```

Put the same application pair in `apps/api/.env`, then restart the local API.
If PostgreSQL is still starting, wait for it to accept connections before
running the two `exec` commands.

### Agent cron

`api.sh` installs an empty POST to `/api/agent/agents/cron` every minute.
No credential is needed in cron or GitHub Secrets for this call. Apply the
agent repository migration before starting the updated API. The queue in
PostgreSQL keeps track of running jobs and their next eligible interval.
The API uses its own RBAC credential to dispatch individual handlers.

The job calls the public API hostname and verifies its certificate. With
`USE_CLOUDFLARE_SSL=true` the hostname resolves to Cloudflare, which presents
its edge certificate; otherwise Traefik serves the Let's Encrypt certificate.
Both chains are publicly trusted. If the server resolves the API hostname to
itself while Traefik holds a Cloudflare Origin CA certificate, curl cannot
verify the chain: add `--cacert` with the Cloudflare Origin CA root to the job
in `api/set_cron_jobs.yaml` rather than disabling verification.

Successful ticks return HTTP 204 with an empty body. curl appends errors to
`/home/code/api_agent_agents_cron.log`.

### Host revalidation secret

Host invalidates tags and page paths through `POST /api/revalidate`. The
API and Host share `HOST_SERVICE_REVALIDATION_SECRET`. The API sends it in
`X-HOST-REVALIDATION-SECRET`. When Host rejects a request, Consistency leaves
the batch pending and retries it.

Configure both services before releasing the upgrade. Update the API and Host
as part of the same rollout so their request format and credential match.

1. Generate a value with `openssl rand -hex 32` for each environment.
2. Set it as `HOST_SERVICE_REVALIDATION_SECRET` in `tools/deployer/.env` and
   the production GitHub secret. Use `PREVIEW_HOST_SERVICE_REVALIDATION_SECRET`
   for the preview GitHub secret.
3. Render the API and Host environment files again through the deployment
   workflow or `./api.sh up` and `./host.sh up` from `tools/deployer`.
   An image release alone does not add the variable to existing services.

In an existing developer checkout, set the same value in `apps/api/.env`
and `apps/host/.env.local`, then restart both services.

### Traefik log level

Traefik defaults to `INFO`. For a short troubleshooting window, set
`TRAEFIK_LOG_LEVEL=DEBUG` in `tools/deployer/.env` or the matching production
or preview GitHub secret, then redeploy only Traefik:

```bash
cd tools/deployer
./traefik.sh up
```

Collect the required diagnostic sample, set the value back to `INFO` (or remove
the override), and run the same deployment command again. Confirm the restored
level from the service command and recent logs:

```bash
docker service inspect traefik_traefik \
  --format '{{json .Spec.TaskTemplate.ContainerSpec.Command}}'
docker service logs traefik_traefik --since 10m
```

Never leave `DEBUG` enabled after troubleshooting; it can repeatedly expose
dynamic routing details and credential hashes in logs.

### Finding an API error

The standard Swarm deployment sends API output to the Linux system journal on
the node that ran the task. The tag is `sps-api-<API_SERVICE_NAME>`; the default
is `sps-api-api`. The deployer checks that a new entry reaches
`/var/log/journal` **before** replacing the API service. Task replacement
preserves the node's journal. On a multi-manager Swarm, check the node of each
relevant task with `docker service ps api_api`. A different node has its own
history. Logs written by an older deployment using Docker's json-file driver
stay with that old container. To see which driver the running deployment
uses, run `docker service inspect api_api --format '{{json .Spec.TaskTemplate.LogDriver}}'`.
For a service still using Docker's default or json-file driver, start with
`docker service logs api_api --since 1h`. See the [Docker journald driver](https://docs.docker.com/engine/logging/drivers/journald/) and [systemd retention settings](https://www.freedesktop.org/software/systemd/man/latest/journald.conf.html).

Connect to the node by SSH with an authorized operator account. These examples
use `jq` to select only incident records from API output. Use the ID shown in
the failed HTTP response, or in a Telegram alert:

```bash
tag=sps-api-api
request_id='paste-the-request-id'
sudo journalctl -t "$tag" --since '7 days ago' --no-pager -o cat |
  jq -Rc --arg id "$request_id" 'fromjson? | objects | select(.event == "api.error" and .requestId == $id)'
```

Start with `category`, `reason` (when recognized), `status`, `route`,
`operation.stage` and `locations[].frames`. The first application location
identifies a source line in the deployed revision; use the task's image to
match it to the release. `ids` contains UUID route parameters, which identify
resources. `subjectId` identifies the subject only when its signed JWT verified.
Operator calls, anonymous requests and unverifiable credentials are marked
separately. An error in a database driver can carry an allowlisted driver code.
For chat attachments the stage distinguishes parsing, validation, storage and
message persistence. Reproduce the operation with a test Subject, equivalent
permissions, synthetic input and the same file types and sizes.

To follow a failing call, copy its `traceId`. Read each linked
`downstreamRequestId` separately if a nested call started another trace. A
repository or background error in the same request can appear as `runtime.error`:

```bash
trace_id='paste-the-trace-id'
sudo journalctl -t "$tag" --since '7 days ago' --no-pager -o cat |
  jq -Rc --arg id "$trace_id" 'fromjson? | objects | select((.event == "api.error" or .event == "runtime.error") and .traceId == $id) | {occurredAt,event,requestId,parentRequestId,downstreamRequestId,route,status,operation,locations}'
```

To watch new incidents, or review which routes returned the most server errors:

```bash
sudo journalctl -t "$tag" -f -o cat |
  jq --unbuffered -Rc 'fromjson? | objects | select(.event == "api.error" or .event == "api.telegram.unavailable")'
sudo journalctl -t "$tag" --since yesterday --no-pager -o cat |
  jq -Rr 'fromjson? | objects | select(.event == "api.error" and .status >= 500) | .route' |
  sort | uniq -c | sort -nr
```

The node administrator controls journal rotation, rate limiting and free space.
`sudo journalctl --disk-usage` shows current usage;
`sudo journalctl -t "$tag" --no-pager -o short-iso | head -1` shows the oldest
available API entry. A seven-day query does not guarantee seven days of
retention. Disk loss, rotation and journal rate limits can remove entries.
For a fixed retention period or recovery after node loss, forward the
allowlisted incident events to a private store with an explicit quota and TTL.

Telegram is optional. Set the four `BUG_SERVICE_*` entries in the deployer's
`.env.example` in your local `.env`, or supply the corresponding repository
secrets for Actions (with `PREVIEW_` on preview deployments). Keep the bot
token private. A blocked network results in one delivery attempt, a local
`api.telegram.unavailable` event and a cooldown. There is no backlog to replay.
See [API diagnostics](../../apps/api/README.md#environment) for the precise
per-process limits and the one allowed chat-migration retry.

Only trusted server operators should have journal or Docker access. Both
grant visibility beyond API incidents. For a future admin view, the narrowest
option is read-only aggregates by route, status and time. For per-incident
lookup, project only the allowlisted fields into a private store, enforce
authenticated RBAC Subject plus a dedicated diagnostics permission and tenant
scope, and audit access. Bound date ranges and pagination. Give the app
neither the Docker socket nor access to host journals, shell commands or
arbitrary file paths. Treat the request ID as a lookup key, never a credential.

### Traefik access log and security headers

Traefik writes one JSON line per request to stdout, beside its own log, and
drops every request header value from that line because requests carry
credentials in headers. Read both with:

```bash
docker service logs traefik_traefik --since 10m
```

The Traefik container log rotates at 10 MB and keeps three files. The API uses
the persistent system journal described above.

The api, host, mcp and telegram routers attach a headers middleware that sends:

- `Strict-Transport-Security: max-age=31536000`, without `includeSubDomains` or
  `preload`, because the host may run on the apex domain and hostnames outside
  this deployer would be pinned to HTTPS as well;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`.

No `Content-Security-Policy` and no frame policy are sent: pages embed widgets
in frames, and a content policy has to be written for each application.

Each service defines its middleware in its own labels, beside its router.
Traefik restarts on every service deployment, because `domain.sh` forces a
Traefik update to load the service certificate, and a middleware defined on the
Traefik service's own labels can be missing after a restart
([traefik/traefik#9363](https://github.com/traefik/traefik/issues/9363)); every
router that references a missing middleware stops being served.

`./traefik.sh up` applies the access log, and each service's own script applies
its headers. `./up.sh` runs both.

### Hardened rollout and verification

Before rollout, confirm DNS and certificates for the Portainer HTTPS hostname
and confirm that no authorized integration depends on public ports `5432` or
`9000`. Run the normal coordinated deployment so Traefik and Portainer are
updated before PostgreSQL, Redis, API, and MCP:

```bash
cd tools/deployer
./up.sh
```

The PostgreSQL and Redis playbooks intentionally stay small: render the Compose
file and deploy the stack, and for PostgreSQL copy the role script the stack
mounts. The Redis wrapper rejects an empty password, and the container command
refuses to start unless it can launch Redis with `requirepass`. Redis stores its
RDB snapshot in `/data`, which is backed by `/home/code/redis_data` on the
server. Both singleton Swarm services use the default stop-first update order,
so two PostgreSQL or two Redis processes never write to the same data directory
at the same time.

After deployment:

```bash
docker service ls
docker service ps traefik_traefik
docker service ps portainer_portainer
docker service ps postgres_postgres
docker service ps redis_redis
ss -ltnp
```

Verify all expected replicas are healthy, ports `5432` and `9000` are absent
from host listeners, Portainer is available over HTTPS, API can use PostgreSQL
and Redis, and MCP logs contain no password-to-passwordless-Redis warning.
Confirm the provider firewall still exposes only `22`, `80`, and `443`.

Prefer fixing forward if the rollout fails. Reverting to a version before this
hardening restores the public `5432`/`9000` configuration and catch-all TCP
routers. If rollback is unavoidable, restrict those ports at the provider
firewall first and recheck host listeners immediately afterward.

## Knowledge embedding provider

Knowledge uses the private `apps/llm` service and its Ollama embedding model by
default. Configure the local route in `tools/deployer/.env` with:

```dotenv
KNOWLEDGE_EMBEDDING_PROVIDER=llm
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_EMBED_DIMENSIONS=768
```

To send indexing chunks and search queries directly from `apps/api` to
OpenRouter instead, configure:

```dotenv
KNOWLEDGE_EMBEDDING_PROVIDER=openrouter
KNOWLEDGE_OPEN_ROUTER_EMBEDDING_MODEL=qwen/qwen3-embedding-8b
OPEN_ROUTER_API_KEY=sk-or-v1-...
```

`api.sh` writes the selected provider, OpenRouter model, and API key into the
server API environment. `llm.sh` writes the local Ollama model and dimensions
into the server LLM environment. `github_deployer.sh` creates the same GitHub
Actions secrets; preview deployments use their `PREVIEW_`-prefixed variants.

Changing the provider or embedding model requires a complete Knowledge
reindex. Do not search a database containing vectors from the previous model.

The server playbook adds `ANSIBLE_USER` to the `docker` group. An SSH session
that was already open before provisioning must be closed and opened again
before commands such as `docker ps` work without `sudo`.

## File storage

The API stores uploads with the provider named by `FILE_STORAGE_PROVIDER`.
`api.sh` does not forward that variable, so a server deployment runs the `local`
provider: uploads are written to `/home/code/api_data` on the server, mounted at
`apps/api/public/file-storage/dynamic` in the API container, and served from the
API origin under `/public`. Every file response carries
`X-Content-Type-Options: nosniff` and `Content-Security-Policy: sandbox`, so a
file opened in a tab cannot run script as the API origin
(`libs/modules/file-storage/README.md`).

Production deployments should store uploads with the `aws-s3` or `vercel-blob`
provider, which serves files from an origin outside the application. Switching
a server deployment requires forwarding more variables through `api.sh` and
`api/api.env.j2`:

- `vercel-blob`: `FILE_STORAGE_PROVIDER`; `BLOB_READ_WRITE_TOKEN` is already
  forwarded.
- `aws-s3`: `FILE_STORAGE_PROVIDER`, `AWS_S3_BUCKET_NAME` (the template renders
  `AWS_S3_BUCKET`, which the provider does not read), and `AWS_ACCESS_KEY_ID`
  and `AWS_SECRET_ACCESS_KEY`, which the template renders but `api.sh` does not
  pass; `AWS_REGION` is already forwarded.

Until then the `FILE_STORAGE_PROVIDER=vercel-blob` line in `.env.example` has
no effect on the API. Check its token before forwarding the variable, because
a placeholder token would break uploads on the next deploy.

`FILE_STORAGE_MAX_UPLOAD_BYTES` bounds a single upload and defaults to 50 MiB:

```dotenv
FILE_STORAGE_MAX_UPLOAD_BYTES=52428800
```

`github_deployer.sh` syncs the value to `FILE_STORAGE_MAX_UPLOAD_BYTES` for
production and `PREVIEW_FILE_STORAGE_MAX_UPLOAD_BYTES` for preview. The
Ansible workflow reads the corresponding secret and `api.sh` writes the
limit into the server API environment. Set `API_MAX_REQUEST_BODY_BYTES`
(128 MiB by default) above the largest upload, allowing for multipart overhead.

## Let's Encrypt certificates

The non-Cloudflare deployment serves HTTP-01 challenge files through the
Certbot nginx container and Traefik's Docker Swarm provider. The deployer:

- creates the shared `traefik_overlay` network explicitly;
- keeps the host's system nginx disabled so Traefik owns ports 80 and 443;
- verifies that the challenge file is publicly reachable before invoking
  Certbot.

DNS must resolve each service hostname to `ANSIBLE_HOST`, and inbound TCP port
`80` must remain open until certificate issuance finishes. If certificate
creation stops at `Verify ACME webroot is publicly reachable`, check DNS and
the Lightsail firewall first; Certbot has not contacted Let's Encrypt yet. If
DNS was just changed, wait for the public record to resolve to `ANSIBLE_HOST`
and rerun the affected service deployment. Certificate failures stop the
deployment instead of registering an unusable certificate path in Traefik.

## GitHub Actions deployment

GitHub-hosted runners cannot use a local key path. Encode the private key as one
line and store it as a repository secret:

```bash
base64 < ~/Downloads/LightsailDefaultKey.pem | tr -d '\n'
```

Configure the following secrets for the production deployment:

- `ANSIBLE_HOST`
- `ANSIBLE_PORT` (`22` for a default Lightsail instance)
- `ANSIBLE_USER` (`ubuntu` for a Lightsail Ubuntu image)
- `ANSIBLE_PRIVATE_KEY_BASE64`

Leave `ANSIBLE_PASSWORD` empty. Preview deployments use the corresponding
`PREVIEW_ANSIBLE_*` secrets. The workflow decodes the key into an ignored file
with mode `0600` before Ansible connects. When `github_deployer.sh` is used, it
encodes `ANSIBLE_PRIVATE_KEY_FILE` automatically if
`ANSIBLE_PRIVATE_KEY_BASE64` is empty.

GitHub-hosted runners start every run with an empty `known_hosts`, so each
workflow run accepts the host key the server presents first. Host key checking
therefore protects deployments run from an operator's machine; to protect
workflow runs as well, write the server's verified key to the runner's
`~/.ssh/known_hosts` before the deployer connects.

A deployment runs when a pull request from `main` into one of the branches that
`github_deployer.sh` creates is merged: `ansible-up` or `ansible-down`, and
`ansible-up-preview` or `ansible-down-preview` for the preview environment. The
`Env` workflow (`.github/workflows/deployer.yml`) starts only for pull requests
into `ansible-*` branches and calls `.github/workflows/ansible.yml` only after a
merge. That workflow runs the script named by the second segment of the branch
name, `up.sh` or `down.sh`, and uses the `PREVIEW_` secrets when the name
contains `-preview`. Closing the pull request without merging deploys nothing.
To start a deployment by hand, choose **Run workflow** on the `Ansible` workflow
and select one of these branches; the run uses that branch's copy of the
workflow files. A run started from `main` finds no script and fails.

Never commit a Lightsail private key, the generated `inventory.yaml`, or a real
`.env` file. They are ignored by the repository.

## Docker image rollout

API startup applies consistency infrastructure migrations before model and
relation migrations, finishes seeding, and then starts the HTTP listener.
A failed migration or seed stops startup. The API service health check probes
its loopback `authentication/me` endpoint and requires a successful HTTP
response; an unauthenticated request returns an empty session. The 30-minute
startup allowance covers migrations. The probe sends `Cache-Control: no-store`
so cache-version lookups cannot stall the liveness request. Without credentials,
the endpoint returns an empty session without querying subjects or identities.
With `start-first` updates, Swarm retains the previous API task until the new
task passes this check. Existing services must apply the API compose health
check once before an image with synchronous migrations is rolled out.

The API release job waits for its Swarm update and every target-image task to
reach `running` before dependent service jobs can continue. It resolves the
service and endpoint from the existing Portainer webhook; no separate service
ID map is required. A paused update, rollback, missing health check or timeout
fails the job and keeps dependent services on their previous images. Check the
gate with `node --test tools/deployer/portainer/wait-service.test.mjs`.

The service deploy creates its Portainer webhook or retrieves the matching one
if the service already has a hook. A login failure or a mismatched hook stops
the play before publishing an update URL. The server and the deployer keep the
token-bearing files readable only by their owner (mode `0600`).

Release workflows still update each service through its Portainer webhook. A
shared preparation job first pulls every unique release image through the
Portainer Docker API and waits for extraction to finish. This prevents API,
Host, LLM, MCP, and Telegram Swarm tasks from concurrently extracting the same
large image before their webhooks run.

The preparation job removes stopped containers and dangling images before the
pull. A failed pull is retried up to three times. When Docker reports
`no space left on device`, cleanup escalates from unused images older than one
day to all images not referenced by a container. Running containers, their
images, networks, and volumes are not removed. The same lock, cleanup, and
retry behavior is used by direct Ansible service deployments.

## Container user

The application image runs as the base image's `node` user, uid 1000 and gid
1000, which owns `/usr/src/app`. Two server paths outlive the containers and
must belong to the same uid:

- `/home/code/api_data`, the API upload directory, mounted at
  `apps/api/public/file-storage/dynamic`;
- the `host_next_static` volume, which keeps the Next.js chunks of earlier
  releases.

On Ubuntu images uid 1000 is the first user account, `ubuntu` on Lightsail, so
uploads show that owner on the host.

`./api.sh up` creates `/home/code/api_data` with that owner, and `./host.sh up`
hands an existing `host_next_static` volume to it before deploying the stack.
Docker fills a new volume from the image, owner included.

A server that already runs the stacks holds root-owned files in both paths.
Releases arrive through Portainer webhooks without running the plays, so give
both paths to uid 1000 once, before the first release that runs as `node`:

```bash
sudo chown -R 1000:1000 /home/code/api_data
sudo chown -R 1000:1000 "$(docker volume inspect --format '{{ .Mountpoint }}' host_next_static)"
```

Running `./api.sh up` and `./host.sh up` has the same effect. A container that
still runs as root keeps working after the change of owner. Without the first
command, uploads and deletions fail with `EACCES` while the API keeps serving;
without the second, the host container exits with `EACCES` during the static
sync, before Next.js starts.

The root `docker-compose.yaml` keeps its own `host_next_static` volume for local
builds, prefixed with the Compose project name. A local volume with root-owned
files needs the same `chown`, or removal.

`docker exec` into an application container opens a shell as `node`; add
`--user root` for administrative work inside the container.

## Next.js deployment skew protection

Host images are built with the Git commit SHA as the Next.js `deploymentId`.
Next.js uses it to detect requests from pages opened before a rolling
deployment and reload those pages when their server and client versions no
longer match.

Each image also contains an immutable copy of its `.next/static` directory.
Before the host starts, those files are merged into the persistent
`next_static` Docker volume. This keeps hashed chunks from previous deployments
available to browser tabs that were already open when the deployment began.

`NEXT_STATIC_RETENTION_DAYS` controls when unused chunks are removed. The
default is 30 days; set it to `0` to disable pruning.

Existing installations must run `tools/deployer/host.sh up` once after this
change so the host service is recreated with the persistent volume. Subsequent
image releases preserve and update the volume automatically.
