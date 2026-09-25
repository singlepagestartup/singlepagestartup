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

Then provision the server and deploy all configured services:

```bash
./up.sh
```

To provision only the server prerequisites without deploying the application
services, run `./server.sh up` instead.

Password authentication remains available for other providers by leaving both
private-key variables empty and setting `ANSIBLE_PASSWORD`.

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

### Generating deployment secrets

Every `X`-placeholder credential in `tools/deployer/.env.example` is operator
supplied. The deployer generates nothing; it only transports what it is given.
Produce each one with a cryptographic source and paste the result:

```bash
openssl rand -hex 32
```

That applies to `RBAC_SECRET_KEY`, `RBAC_JWT_SECRET`,
`RBAC_COOKIE_SESSION_SECRET`, `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET`,
`AGENT_CRON_SECRET`, `DATABASE_PASSWORD`, `REDIS_PASSWORD`, `TRAEFIK_PASSWORD`
and `PORTAINER_PASSWORD`. Do not copy these values out of a locally bootstrapped
`apps/api/.env` into a deployment; generate fresh ones for each environment, and
keep the production and `PREVIEW_` sets distinct.

The API refuses to start on a secret it can recognize as guessable. Its
`API_SECRET_STRENGTH` variable defaults to `enforce`, which stops the process
when `RBAC_SECRET_KEY` or `RBAC_JWT_SECRET` is absent or carries the shape of the
generator described below. `API_SECRET_STRENGTH=report` logs the same findings
and starts anyway; it exists for a deployment that cannot rotate in the same
maintenance window, and leaving it set is an explicit decision to keep running
on an authorization bypass that can be found offline. The report names keys and
verdicts only, never a value.

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

| Value                                        | What to do                                                                                                                                                                   | Effect                                                                                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD` / `DATABASE_PASSWORD`    | run `ALTER ROLE "<user>" WITH PASSWORD '<new>';` inside the running PostgreSQL container, then update `tools/deployer/.env` and the GitHub secret, then redeploy API and MCP | editing `apps/db/.env` alone does nothing: the image is a stock PostgreSQL entrypoint and `POSTGRES_PASSWORD` applies only at the first init of `db_data` |
| `REDIS_PASSWORD`                             | follow the coordinated procedure above: update the secret, deploy Redis, API and MCP as one rollout, then force-update `api_api` and `mcp_mcp`                               | cache and KV unavailable for the window                                                                                                                   |
| `RBAC_JWT_SECRET`                            | rotate in `tools/deployer/.env` and in the GitHub secrets, then deploy API, Telegram and MCP together                                                                        | every access and refresh token is invalidated. It also rotates the MCP OAuth signing key, because the MCP template falls back to this value               |
| `RBAC_SECRET_KEY`                            | rotate in `tools/deployer/.env` and in the GitHub secrets, then deploy API, Telegram and MCP                                                                                 | this is the full authorization bypass. The middleware also accepts it from an `rbac.secret-key` cookie, so any browser that received it holds a copy      |
| `AGENT_CRON_SECRET`                          | rotate in `tools/deployer/.env` and in the GitHub secrets, then run `./api.sh up`, which writes the API environment and the server crontab in one run                        | opens only `POST /api/agent/agents/cron`; cron calls are refused between the API restart and the crontab update                                           |
| `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET` | rotate and deploy API and MCP together                                                                                                                                       | the API-to-MCP exchange fails until both sides match                                                                                                      |
| `RBAC_COOKIE_SESSION_SECRET`                 | rotate for hygiene                                                                                                                                                           | no runtime effect: nothing reads it today                                                                                                                 |
| Administrator identity password              | change it through the API or the admin UI, then update `apps/api/.env` and `.agents/.env`                                                                                    | editing `.env` alone does not change the stored bcrypt hash; that value is only the bootstrap input                                                       |

Four copies survive a rotation unless they are handled as well:

- **Docker images.** `.dockerignore` does not exclude `apps/api/.env`,
  `apps/mcp/.env`, `apps/telegram/.env` or `tools/deployer/.env`, and the
  Dockerfile copies the working tree, so any image built from a bootstrapped
  checkout carries the old values. Rebuild and re-tag, and treat previously
  pushed tags as carrying them.
- **GitHub Actions secrets.** Replace both the production and the `PREVIEW_`
  variants of the four RBAC values.
- **`tools/deployer/.env`** on the operator's own machine.
- **The server crontab.** It holds `AGENT_CRON_SECRET`, per the row above. A
  crontab installed before that value existed holds `RBAC_SECRET_KEY` until
  `./api.sh up` runs once.

Afterwards, treat the window before the rotation as one in which the old
`RBAC_SECRET_KEY` could have been guessed. Review the action log for requests
carrying `X-RBAC-SECRET-KEY` from unexpected sources, confirm the identity and
subject tables hold no account that was not created through a normal flow, and
force password resets if the deployment is public.

### Agent cron

`api.sh` installs a root crontab entry that calls
`POST /api/agent/agents/cron` every minute with `AGENT_CRON_SECRET` in the
`X-AGENT-CRON-SECRET` header. That secret opens the cron route and no other
route; the API also accepts the operator credential there. `api.sh` refuses to
deploy while `AGENT_CRON_SECRET` is empty.

The job calls the public API hostname and verifies its certificate. With
`USE_CLOUDFLARE_SSL=true` the hostname resolves to Cloudflare, which presents
its edge certificate; otherwise Traefik serves the Let's Encrypt certificate.
Both chains are publicly trusted. If the server resolves the API hostname to
itself while Traefik holds a Cloudflare Origin CA certificate, curl cannot
verify the chain: add `--cacert` with the Cloudflare Origin CA root to the job
in `api/set_cron_jobs.yaml` rather than disabling verification.

curl appends each response to `/home/code/api_agent_agents_cron.log`. A body
with `"status":401` there means the crontab and the API environment hold
different values; run `./api.sh up` to write both again.

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

### Traefik access log and security headers

Traefik writes one JSON line per request to stdout, beside its own log, and
drops every request header value from that line because requests carry
credentials in headers. Read both with:

```bash
docker service logs traefik_traefik --since 10m
```

The Traefik container log rotates at 10 MB and keeps three files, like the
application services.

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
file and deploy the stack. The Redis wrapper rejects an empty password, and the
container command refuses to start unless it can launch Redis with
`requirepass`. Redis stores its RDB snapshot in `/data`, which is backed by
`/home/code/redis_data` on the server. Its singleton Swarm service uses the
default stop-first update order so two Redis processes never write to that
directory at the same time.

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

Never commit a Lightsail private key, the generated `inventory.yaml`, or a real
`.env` file. They are ignored by the repository.

## Docker image rollout

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
