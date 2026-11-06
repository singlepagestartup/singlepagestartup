---
date: 2026-09-26T00:17:04+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-317-docker-hardening
repository: singlepagestartup
topic: "Complete the Docker ignore list, pin base images and run as a non-root user"
tags: [research, codebase, docker, dockerignore, dockerfile, bun, deployer, ansible, host, api, llm, redis]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Complete the Docker ignore list, pin base images and run as a non-root user

**Date**: 2026-09-26T00:17:04+03:00
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-317-docker-hardening
**Repository**: singlepagestartup

## Research Question

What the root image build takes into its context, which versions the Dockerfiles
resolve, which user the image runs as and which paths it writes at runtime, and
who consumes the image: CI, the deployer, the local compose files and the
runtime scripts. The question comes from findings SEC-26 and the Docker image
row of N-10 in `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`.

## Summary

- The root `Dockerfile` builds one image. CI publishes it under five repository
  names (host, api, telegram, llm, mcp), and each deployer stack starts it with
  `start.sh <service>`.
- The build context is the checkout root. `.dockerignore` excludes the db, redis
  and host env files and the `.claude`, `.codex`, `.cursor` and `thoughts`
  directories. It does not exclude `apps/api/.env`, `apps/mcp/.env`,
  `apps/telegram/.env`, `apps/llm/.env`, `apps/openapi/.env`, root `.env*`
  files, `.agents/.env` or anything under `tools/deployer`, where an operator's
  checkout keeps `.env`, `.env.preview`, inventories, SSH keys and provider
  credentials (`tools/deployer/.gitignore`). CI builds from a clean checkout, so published images contain
  tracked files only. A local build from a bootstrapped checkout copies the live
  files; the root `docker-compose.yaml` is one such local build.
- Four tracked env files are not examples and are read by the build or at
  runtime: `apps/api/.env.production`, `apps/host/.env.production`,
  `apps/host/.env.development` and `apps/mcp/.env.production`. The Dockerfile
  appends build arguments to `apps/host/.env.production`, and `create_env.sh`
  copies it into the host's runtime `.env.local`.
- `FROM node:24` resolves to Node 24.21.0 on Debian bookworm, the same index
  digest as `node:24.21.0-bookworm`. `apps/redis/Dockerfile` resolves
  `redis:latest` to Redis 8.10.2 on `debian:trixie-slim`; `redis:8.10.2-trixie`
  is the same build for amd64 and arm64. Production Redis does not use this
  Dockerfile: the deployer template runs `image: redis`.
- The Dockerfile installs the newest Bun release through `curl | bash` into
  `/root/.bun`. The `bun` npm package is a production dependency locked at
  1.2.5, and every runtime entry point (`npm run`, `npx`, Nx `run-commands`)
  puts `node_modules/.bin` first on `PATH`, so the services run Bun 1.2.5.
- The image has no `USER` instruction and runs as root. The base image ships a
  `node` user with uid 1000, gid 1000 and home `/home/node`; `/root` is mode
  `0700`, so a non-root user cannot run a binary installed under `/root/.bun`.
- At runtime the services write into the app directories (`.env` files created
  by `create_env.sh`), the workspace root (`.nx`, which the build deletes and Nx
  recreates), `apps/host/.next`, the `next_static` volume over
  `apps/host/.next/static`, the upload directory
  `apps/api/public/file-storage/dynamic`, which production bind-mounts from
  `/home/code/api_data`, the OS temp directory and `$HOME/.cache`. Nothing
  writes `apps/host/public`, the directory `Dockerfile:61` opens with
  `chmod -R 777`.
- On an existing server both mounts hold root-owned files. A fixture run showed
  that the host's static sync fails with `EACCES` as uid 1000 on a root-owned
  volume, which stops `start.sh host`, and passes after `chown -R 1000:1000`.
- `apps/llm/Dockerfile` copies its directory with no `.dockerignore`, and
  `apps/llm/up.sh` rebuilds it on every start, so the local LLM image carries
  `apps/llm/.env`.

## Detailed Findings

### Build context of the root image

- `.dockerignore:1-85` holds sections for Nx, Git, AI development artifacts,
  Node, Husky, IDE, Studio, database, redis and host. Env and key entries exist
  only for three apps: `apps/db/.env` (`:52`), `apps/redis/.env` (`:58`),
  `apps/host/.env`, `.env*.local`, `.env*.testing` (`:66-68`) and the host ICP
  key material `apps/host/*.key`, `*.pem`, `*.pem.base64`, `*-wallet.txt`,
  `.env.cloudflare` (`:81-85`).
- The AI section excludes `.claude`, `.codex`, `.cursor` and `thoughts`
  (`:17-20`). `.agents`, which holds `.agents/.env` with the browser-test
  administrator password (`.agents/.env.example` lists the keys), is not
  listed. Runtime code does not read `.agents`: the only reference outside
  Studio and `tools/` dev scripts is an echo line in `apps/api/create_env.sh:124`.
- `Dockerfile:30` copies the whole context with `COPY . .`.
- A fixture context built under the current `.dockerignore` (placeholder files
  at every path, `COPY . /ctx`, list of files) kept these secret-bearing paths:
  root `.env` and `.env.local`, `.agents/.env`, `apps/api/.env`,
  `apps/api/.env.local`, `apps/llm/.env`, `apps/mcp/.env`, `apps/openapi/.env`,
  `apps/telegram/.env`, `tools/deployer/.env`, `.env.preview`,
  `inventory.yaml`, `inventory.preview.yaml`, `rsa.pem`, `certs/origin.key`,
  `iams/iam.env`, `aws/production.env`, and a `.key` file under `libs/`.
- Tracked env files (`git ls-files`): the examples `.agents/.env.example`,
  `apps/{db,llm,openapi,redis,telegram}/.env.example`,
  `tools/deployer/.env.example`; the deployer templates
  `tools/deployer/*/*.env.j2` and `host.env.local.j2`; and four files that are
  neither: `apps/api/.env.production` (keys `NODE_ENV`, `API_SERVICE_URL`,
  `HOST_SERVICE_URL`, seed flags, `NEXT_PUBLIC_REVALIDATE`,
  `FILE_STORAGE_PROVIDER`, `FILE_STORAGE_FOLDER`, `KV_PROVIDER`, `KV_TTL`,
  `MIDDLEWARE_HTTP_CACHE`, `AGENT_MAX_DURATION_IN_SECONDS`),
  `apps/host/.env.production` and `apps/host/.env.development` (`NODE_ENV`,
  public service URLs, `API_SERVICE_URL`, `NEXT_PUBLIC_REVALIDATE`) and
  `apps/mcp/.env.production` (`API_SERVICE_URL`, `MCP_SERVICE_HTTP_HOST`,
  `MCP_SERVICE_HTTP_PORT`, `MCP_SERVICE_AUTH_REQUIRED`,
  `MCP_SERVICE_ALLOW_RBAC_SECRET_FALLBACK`).
- `Dockerfile:33-37` appends the `NEXT_PUBLIC_*` and Metrika build arguments to
  `apps/host/.env.production`; `create_env.sh:13-26` copies that file into
  `apps/host/.env.local` before the host starts.
- No tracked file matches `*.pem`, `*.key`, `*.pem.base64`, `*-wallet.txt` or
  `*.env`; only the deployer templates match `*.env.*`.
- BuildKit honours an exception inside an excluded directory: a prototype with
  `tools/deployer` followed by `!tools/deployer/get_env.sh` and
  `!tools/deployer/generate_secret.sh` kept exactly those two files. A
  directory rule placed after `!**/.env.example` removes that directory's
  example too (`.agents/.env.example`, `tools/deployer/.env.example`).

### What the image needs from `tools/deployer`

- `start.sh:5-27` calls `./create_env.sh <service> deployment`, which only
  materialises the process environment (`create_env.sh:3-48`) and sources
  nothing.
- The development branch of `create_env.sh:50-55` runs the per-app scripts,
  which source `tools/deployer/get_env.sh` (`apps/api/create_env.sh:2`,
  `apps/host/create_env.sh:2`, `apps/mcp/create_env.sh:2`,
  `apps/telegram/create_env.sh:2`) and `tools/deployer/generate_secret.sh`
  (`apps/api/create_env.sh:3`, `apps/db/create_env.sh:2`,
  `apps/redis/create_env.sh:2`, `apps/telegram/create_env.sh:3`).
  `apps/api/create_rbac_subject.sh:6` and `apps/api/delete_rbac_subject.sh:2`
  source `get_env.sh` as well.
- Both helpers are self-contained (`tools/deployer/get_env.sh:1-45`,
  `tools/deployer/generate_secret.sh:1-60`). `migrate.sh:1-27` runs Nx targets
  only. `tools/deployer` is not an Nx project; its only `package.json` is
  `tools/deployer/github/github-node-api/package.json`, and the root
  `package.json` declares no workspaces.
- `tools/deployer/.gitignore` lists the operator files that live there
  locally: `iams`, `certs`, `*.env`, `*.env.*`, `inventory.yaml*`,
  `inventory.*.yaml`, `*_webhook.json`, `*.pem`, `*.key`, `*.pub`, `*rsa`.

### Consumers of the image

- `.github/workflows/docker-image.yml:22-23` checks out the repository and
  `:108-134` builds with `context: ./` and pushes one image to every configured
  repository (`:55-99`: host, api, telegram, llm, mcp). `release.yml:14-15` and
  `update-host.yml:10-11` call it.
- The deployer stacks run the image with `command: "sh -c './start.sh <service>'"`
  and no `user:` key: `tools/deployer/api/docker-compose.api.yaml.j2:12`,
  `host/docker-compose.host.yaml.j2:12`, `telegram/...:10`, `mcp/...:10`,
  `llm/...:10`. Releases roll out through Portainer webhooks
  (`tools/deployer/README.md` "Docker image rollout"), without re-running the
  Ansible plays.
- The root `docker-compose.yaml:18-33` builds the root `Dockerfile` locally for
  a `host` service and mounts the named volume `host_next_static` over
  `/usr/src/app/apps/host/.next/static`.
- No play or script runs `docker exec` into an app container; the README's
  `docker exec` examples target PostgreSQL and Redis.

### Base images

- `Dockerfile:1` `FROM node:24`. On 2026-09-26 the tags `node:24`,
  `node:24.21.0`, `node:24-bookworm` and `node:24.21.0-bookworm` share the index
  digest `sha256:64af3819f9275802414d7cdc38c27e9d82bd564dec4d4da87d008255d36c63b4`;
  the base is `buildpack-deps:bookworm`, `NODE_VERSION=24.21.0`, Python 3.11.2.
- `apps/redis/Dockerfile:1` `FROM redis:latest`: `REDIS_VERSION=8.10.2`, base
  `debian:trixie-slim`, revision `8104e63b`. `redis:8.10.2-trixie` has the same
  revision and build date; its index lacks only the riscv64 image, which is why
  its index digest differs from `latest`. `apps/redis/docker-compose.redis.yaml:5-7`
  builds it for local development.
- Other floating references outside the finding: `apps/db/Dockerfile:1`
  `pgvector/pgvector:pg17`; the deployer templates `redis`, `pgvector/pgvector:pg17`,
  `ollama/ollama:latest`, `portainer/agent`, `portainer/portainer-ce`,
  `nginx:alpine`, `traefik:v3.7`; `apps/db/docker-compose.adminer.yaml:5`
  `adminer`; `apps/llm/Dockerfile:1` `python:3.12-slim`;
  `tools/deployer/icp/Dockerfile:1` `node:18`; `.devcontainer/Dockerfile` and
  `.gitpod.Dockerfile`.
- The repository has no `.github/dependabot.yml`, so nothing bumps a pinned tag.

### Bun

- `Dockerfile:6` runs `curl -fsSL https://bun.sh/install | bash` with no
  argument; the installer then downloads `releases/latest`. With a first
  argument such as `bun-v1.2.5` it downloads that release, and `BUN_INSTALL`
  sets the install directory (lines 130-142 of the script served at
  `https://bun.sh/install` on 2026-09-26). If the script download itself fails,
  `bash` reads an empty script and the pipeline still succeeds. `Dockerfile:9`
  puts `/root/.bun/bin` on `PATH`.
- `package.json:125` declares `"bun": "^1.2.3"` under `dependencies`;
  `package-lock.json:22631` locks `node_modules/bun` and the `@oven/bun-*`
  platform packages at 1.2.5.
- Runtime entry points: `package.json:7` `api:start` is `nx run api:start`,
  `apps/api/project.json:15-20` runs `bun run start`, `apps/api/package.json:6`
  runs `bun server.ts`; `migrate.sh` runs `npx nx run ...`. `npm run` and `npx`
  put `<root>/node_modules/.bin` first on `PATH` (checked with `npm run env` and
  `npx -c 'echo $PATH'`), and Nx `run-commands` builds `PATH` with
  `npm-run-path` and overrides the inherited value
  (`node_modules/nx/src/executors/run-commands/running-tasks.js:393-408`). These
  entry points therefore resolve the locked 1.2.5 binary before the global one.
- A prototype with `BUN_INSTALL=/usr/local` and the argument `bun-v1.2.5`
  installed `/usr/local/bin/bun`, reported `1.2.5`, and ran as uid 1000.

### Runtime user and the paths the services write

- No `USER` instruction exists in `Dockerfile:1-63`. `Dockerfile:61` runs
  `chmod -R 777 /usr/src/app/apps/host/public`; `:58` is a commented-out
  `chmod -R 777 /usr/src/app`.
- `node:24.21.0-bookworm` defines `node` as uid 1000, gid 1000, home
  `/home/node` owned by `node`; `/root` is `drwx------`.
- Paths written at runtime:

  | Path                                                                    | Writer                                                                                                                                                                                      | Service                                                       |
  | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
  | `apps/api/.env`, `apps/telegram/.env`, `apps/mcp/.env` (mode `600`)     | `create_env.sh:3-11,33-47`, called from `start.sh:11,16,20`                                                                                                                                 | api, telegram, mcp                                            |
  | `apps/host/.env.local` (mode `600`)                                     | `create_env.sh:13-31`, called from `start.sh:6`                                                                                                                                             | host                                                          |
  | `/usr/src/app/.nx/cache`, `/usr/src/app/.nx/workspace-data`             | Nx, on every `nx run` from `package.json` scripts and `migrate.sh:7-26`                                                                                                                     | all Node services                                             |
  | `apps/api/public/<FILE_STORAGE_FOLDER>/<name>.<ext>`, create and unlink | `libs/providers/file-storage/src/lib/local/index.ts:11-19,37-48,75`; single-level `mkdir` when the folder is missing                                                                        | api (uploads, URL imports, replacements, knowledge ingestion) |
  | `apps/host/.next/static` (the `next_static` volume in production)       | `tools/runtime/sync-next-static.mjs:77-121`, called from `start.sh:7`                                                                                                                       | host                                                          |
  | `apps/host/.next/cache`                                                 | the default Next.js incremental cache; `apps/host/next.config.js` sets no `cacheHandler` and `images.unoptimized: true` (`:30`); routes with `revalidate` and `app/api/revalidate` write it | host                                                          |
  | `os.tmpdir()/sps-telegram-audio-*`                                      | `apps/telegram/src/lib/telegram-bot.ts:1679-1723`                                                                                                                                           | telegram                                                      |
  | `os.tmpdir()/sps-audio-transcription-*`                                 | `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/audio-transcription.ts:573-606`                    | api                                                           |
  | `tempfile.NamedTemporaryFile` in `/tmp`                                 | `apps/llm/routers/openai/audio.py:34-61`                                                                                                                                                    | llm                                                           |
  | `$HOME/.cache/huggingface`                                              | `apps/llm/services/openai/whisper.py:25-36`, no `HF_HOME` or `cache_dir` override                                                                                                           | llm                                                           |

- Nothing writes `apps/host/public` at runtime: no file under `apps/host`
  imports `fs`, and the host does not use the file-storage provider. Every file
  there is tracked in Git. MCP keeps OAuth state in memory or Redis
  (`apps/mcp/lib/oauth.ts:118-124,175-236`), and Telegram has no file-based
  session store.
- Production sets `FILE_STORAGE_FOLDER` to `file-storage/dynamic`
  (`tools/deployer/api/api.env.j2:10`, `apps/api/.env.production:16`), the
  bind-mount target. The seed inserts
  database rows that reference tracked files under
  `apps/api/public/file-storage/static` and copies no bytes.

- The build deletes `/usr/src/app/.nx` (`Dockerfile:47`). Nx resolves its cache
  and workspace data to `<root>/.nx/cache` and `<root>/.nx/workspace-data`
  (`node_modules/nx/src/utils/cache-directory.js:28-52`), so every `nx run` at
  runtime recreates `.nx` in `/usr/src/app`.
- A prototype image owned by `node` created `apps/api/.env`,
  `apps/telegram/.env`, `apps/mcp/.env` and `apps/host/.env.local` with mode
  `600`, created `.nx/workspace-data`, and wrote into `apps/host/public` and
  `apps/api/public/file-storage/dynamic` as uid 1000.

### Deployment state on existing servers

- `tools/deployer/api/create_api.yaml:12-15` creates `/home/code/api_data` with
  the `file` module and no owner, so the directory and every upload in it are
  owned by root. `tools/deployer/api/docker-compose.api.yaml.j2:8-9` mounts it at
  `/usr/src/app/apps/api/public/file-storage/dynamic`.
- `tools/deployer/host/docker-compose.host.yaml.j2:10-11,36-37` declares the
  named volume `next_static` over `/usr/src/app/apps/host/.next/static`; the
  stack is deployed as `host` (`tools/deployer/host/create_host.yaml:41-42`), so
  the volume is `host_next_static`. Docker fills a new, empty named volume from
  the image directory, ownership included; an existing volume keeps the owner
  of the files written into it.
- `start.sh:7` runs `node ./tools/runtime/sync-next-static.mjs` under
  `set -euo pipefail`. The sync copies over, touches and prunes files in the
  volume (`tools/runtime/sync-next-static.mjs:77-121`) and exits with code 1 on
  failure (`:150-157`).
- Fixture runs with the prototype image as uid 1000: a new volume was filled
  as `node:node` and the sync passed; a volume written by a root container
  failed with `EACCES: permission denied, unlink '.../chunks/main.js'` and exit
  code 1; after `chown -R 1000:1000` on that volume the sync passed and kept the
  earlier chunk.
- Plays escape Docker format strings with `{% raw %}` (for example
  `tools/deployer/traefik/create_traefik.yaml:95`) and use `recurse: yes` on
  `file` tasks (`tools/deployer/certbot/create_certbot.yaml:13-18`).

### The LLM app image

- `apps/llm/Dockerfile:15` copies its directory with `COPY . .`; `apps/llm` has
  no `.dockerignore`, while `apps/host`, `apps/db` and `apps/redis` have one that
  mirrors their `.gitignore`.
- `apps/llm/up.sh:19` runs `docker-compose up -d --build`, and
  `apps/llm/docker-compose.yml:3` builds from `.`. `apps/llm/.gitignore` marks
  `.env`, `.env*.local`, `.env*.testing`, `.venv` and `.ollama` as local.
- `apps/llm/docker-compose.yml:8` mounts the `whisper-models` volume at
  `/root/.cache/huggingface`, the cache directory of a root process.
- Production runs the LLM service from the root image (`start.sh:23-26`), not
  from this Dockerfile.

### Documentation of the current state

- `tools/deployer/README.md:184-190` ("Four copies survive a rotation") states
  that `.dockerignore` does not exclude `apps/api/.env`, `apps/mcp/.env`,
  `apps/telegram/.env` or `tools/deployer/.env`.
- `tools/deployer/README.md` "Next.js deployment skew protection" describes the
  `next_static` volume and the one-time `host.sh up` for existing installations.

### Checks available

- `docker build --check` reports no warnings for the current `Dockerfile` or
  the prototype.
- `ansible-playbook` is installed locally; `hadolint` and `ansible-lint` are not.

## Code References

- `.dockerignore:1-85` - build-context exclusions of the root image
- `Dockerfile:1` - `FROM node:24`
- `Dockerfile:3-9` - apt packages, unpinned Bun installer, `/root/.bun/bin` on `PATH`
- `Dockerfile:30` - `COPY . .`
- `Dockerfile:33-37` - build arguments appended to `apps/host/.env.production`
- `Dockerfile:46-49` - host build, `.nx` removal, `.next-static-release` copy
- `Dockerfile:58-61` - `chmod` lines, including `chmod -R 777 apps/host/public`
- `apps/redis/Dockerfile:1` - `FROM redis:latest`
- `apps/llm/Dockerfile:15` - `COPY . .` without an ignore file
- `start.sh:5-27` - service dispatch
- `create_env.sh:3-48` - runtime env materialisation into the app directories
- `migrate.sh:7-27` - Nx migrate and seed targets
- `tools/runtime/sync-next-static.mjs:56-131` - static sync into the shared volume
- `tools/deployer/api/create_api.yaml:12-15` - `/home/code/api_data` creation
- `tools/deployer/api/docker-compose.api.yaml.j2:8-9` - upload bind mount
- `tools/deployer/host/docker-compose.host.yaml.j2:10-11,36-37` - `next_static` volume
- `tools/deployer/host/create_host.yaml:41-42` - host stack deployment
- `tools/deployer/README.md:184-190` - current-state note about the ignore list
- `.github/workflows/docker-image.yml:108-134` - CI image build
- `docker-compose.yaml:18-33` - local build of the root image
- `package.json:125`, `package-lock.json:22631` - locked Bun 1.2.5

## Architecture Documentation

- One image serves five services; the compose `command` selects the role and
  `create_env.sh` turns the injected environment into the `.env` file each app
  reads.
- Per-app `.dockerignore` files mirror the app's `.gitignore`; the root
  `.dockerignore` is organised in banner-commented sections.
- Server state lives under `/home/code` and is prepared by the service plays
  with the Ansible `file` module; image rollouts go through Portainer webhooks.
- Every runtime command reaches Bun through `node_modules/.bin`, which the
  lockfile pins and npm verifies by integrity hash.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-233.md:137` recorded the
  unpinned Bun installer and the container-wide `NODE_OPTIONS` heap setting.
- `thoughts/shared/research/singlepagestartup/2026-09-10-studio-docker-boundary.md`
  added the `apps/studio` exclusion and verified it with a temporary
  Dockerfile against the real context.
- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`,
  SEC-26 and N-10, raised this issue.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-233.md`
- `thoughts/shared/research/singlepagestartup/2026-09-10-studio-docker-boundary.md`

## Open Questions

- None block this issue. The floating image references in the deployer compose
  templates and `apps/db/Dockerfile` sit outside SEC-26 and the Docker image row
  of N-10.
