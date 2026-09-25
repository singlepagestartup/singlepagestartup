Closes #317.

## Summary

A Docker build from a checkout that has run the bootstrap scripts copied every env file the ignore list did not name into the image: the api, mcp, telegram, llm and openapi `.env` files, root `.env` files, `.agents/.env`, and all of `tools/deployer` with the operator's env files, inventories, SSH keys and provider credentials. CI builds from a clean checkout, so the published images held tracked files only; the root `docker-compose.yaml` and any manual build did not. The image also ran as root, followed the floating `node:24` tag and the newest Bun release, and opened `apps/host/public` with `chmod -R 777`.

The build context now leaves out every env and key file except the examples and four tracked defaults, the base images and Bun are pinned to the versions that already run, and the image runs as the base image's `node` user. The deployer gives that user the two server paths it writes, and its README documents the one-time step for running servers.

## Changes

- `.dockerignore`: a "Secrets" section denies `.env*`, `*.env`, `*.env.*`, `*.pem`, `*.pem.base64`, `*.key` and `*-wallet.txt` anywhere, then re-includes the examples and `apps/api/.env.production`, `apps/host/.env.production`, `apps/host/.env.development` and `apps/mcp/.env.production`, which the build and the services read. `.agents` joins the AI directories. `tools/deployer` is excluded except `get_env.sh` and `generate_secret.sh`, which the app `create_env.sh` scripts source. The per-app env and key lines the section covers are removed.
- `apps/llm/.dockerignore` (new, beside the host, db and redis ones): keeps `.env*` except the example, `.venv` and `.ollama` out of the image that `apps/llm/up.sh` rebuilds on every start.
- `Dockerfile`: `node:24.21.0-bookworm`, the image `node:24` resolves to today (same index digest). Bun 1.2.5, the version `package-lock.json` locks and the services already run from `node_modules/.bin`, now installs into `/usr/local` because the base image's `/root` is `0700`; the build fails if `bun --version` reports another version. `USER node` (uid 1000, gid 1000) with `COPY --chown=node:node`, so the runtime user owns everything the services write under `/usr/src/app`: the app `.env` files, `.nx`, `.next` and the upload directory. Both `chmod 777` lines are gone; nothing writes `apps/host/public` at runtime.
- `apps/redis/Dockerfile`: `redis:8.10.2-trixie`, the build `redis:latest` resolves to today.
- `tools/deployer/api/create_api.yaml`: `/home/code/api_data` is created, or re-owned, as 1000:1000.
- `tools/deployer/host/create_host.yaml`: before the stack deploy, an existing `host_next_static` volume is handed to 1000:1000. A missing volume is skipped; Docker fills a new one from the image with the image's owner.
- `tools/deployer/README.md`: a "Container user" section with the uid, the one-time `chown` for running servers and the local compose volume; the "Docker images" bullet of the rotation section describes the new ignore list.

No TypeScript, schema, compose command or port changes. The branch also carries the research, plan, process and progress records under `thoughts/shared/`.

## Verification

- [x] Fixture context, 63 placeholder files at the sensitive paths (`FROM alpine:3.22`, `COPY . /ctx`, file list): the previous ignore list keeps root `.env` and `.env.local`, `.agents/.env`, `apps/{api,llm,mcp,openapi,telegram}/.env`, and from `tools/deployer` the `.env`, `.env.preview`, both inventories, `rsa.pem`, `certs/*.key`, `iams/*.env` and `aws/*.env`. The new list keeps 23 files: examples, the four defaults, app code and the two helpers. 25 paths removed, none added.
- [x] Worktree context holding live `.env` files for api, db, llm, mcp, openapi, redis, telegram, `.agents` and `.claude`: `find /ctx -name '.env*' -o -name '*.env' -o -name '*.pem' -o -name '*.key' -o -name 'inventory.yaml*'` lists only the examples and the four defaults; `tools/deployer` holds the two helpers; `.agents` and `.claude` are absent.
- [x] `apps/llm` context: `.env.example` is the only env file.
- [x] `docker build --check .` and `docker build --check apps/redis`: no warnings.
- [x] The real `Dockerfile` built on a minimal context: uid 1000, `bun` 1.2.5 in `/usr/local/bin`, no file under `/usr/src/app` owned by another user. As uid 1000 the image writes the four runtime env files with mode 600, `.nx`, an upload, `/tmp` and `$HOME/.cache`, and `start.sh` runs.
- [x] Static sync as uid 1000: passes on a new volume, fails with `EACCES` on a root-owned one, passes after `chown -R 1000:1000` and keeps the earlier chunk. Upload directory: a write and a delete fail on a root-owned mount and pass after the same `chown`.
- [x] `docker build apps/redis`: `redis-server` 8.10.2.
- [x] `ansible-playbook --syntax-check` for both plays. The volume lookup task, run verbatim against local Docker, returns the mount point of an existing volume and rc 1 without failing for a missing one.
- [x] The real `Dockerfile` up to the host build (its first 49 lines) on the real worktree context: `npm ci` adds 3033 packages as uid 1000 and the LLM venv installs. In that image nothing under `/usr/src/app` belongs to another user, every file `start.sh`, `migrate.sh` and `create_env.sh` reference is present, the only env files outside `node_modules` are the examples and the four defaults, and `npm run` resolves `bun` from `node_modules/.bin` (1.2.5).
- [x] Nx as uid 1000 creates `.nx` and finds every target `migrate.sh` runs: 16 `repository-migrate` projects, the RBAC repair target and `api:db:seed`.
- [x] The file-storage provider as uid 1000, called the way the upload controller calls it: stores and deletes a file in `file-storage/dynamic`, fails with `EACCES` on a root-owned mount, passes after `chown -R 1000:1000`.
- [ ] Full image build: not run locally. The Docker VM here has 3.8 GB of memory, and the host build needs a larger heap than that; the Docker image workflow builds it from a clean checkout.
- [ ] On a running server: the ownership step, a release, an upload through the API.

## Notes

- Running servers need the ownership step before the first release built from this branch reaches them; the Downstream migration section below and the README list the commands. A container that still runs as root keeps working after the change of owner, so the step can run first.
- The deployer compose templates still use floating images (`redis`, `pgvector/pgvector:pg17`, `ollama/ollama:latest`, Portainer, `nginx:alpine`); production Redis runs from `image: redis`, not from `apps/redis/Dockerfile`. They stay with the deployer work in #319 or a follow-up.
- No Dependabot configuration exists, so the pinned tags move by hand: `node` with each Node 24 security release, `BUN_VERSION` with the `bun` package in `package-lock.json`.
- `apps/llm/Dockerfile` still runs as root: its compose file keeps the model cache at `/root/.cache/huggingface`. Production runs the LLM service from the root image, as `node`.

## Downstream migration

Adaptation is required. The image runs as uid 1000, and the ignore list drops every env and key file it does not re-include.

**Applies to:** projects that deploy the SPS image to a server that already ran it as root, that customized the root `Dockerfile` or `.dockerignore`, that track env or key files the image needs beyond the four framework defaults, or that mount further writable paths into the application containers.

**Actions:**

- Before the first release built from this version reaches a running server, run on the server:

  ```bash
  sudo chown -R 1000:1000 /home/code/api_data
  sudo chown -R 1000:1000 "$(docker volume inspect --format '{{ .Mountpoint }}' host_next_static)"
  ```

  or re-run `./api.sh up` and `./host.sh up`. Containers that still run as root keep working after the change of owner.

- In a customized `Dockerfile`, keep every step that needs root above `USER node`, copy project files with `--chown=node:node`, and keep `BUN_VERSION` equal to the `bun` version in `package-lock.json`.
- Add a `!` exception to `.dockerignore` for each tracked file the image must keep that matches `.env*`, `*.env`, `*.env.*`, `*.pem`, `*.pem.base64`, `*.key` or `*-wallet.txt`, and for each file under `tools/deployer` the image reads.
- Give uid 1000 every other volume or bind mount the application containers write, including a local `host_next_static` volume of the root `docker-compose.yaml`.

**Verify:** build the image from a checkout that holds live `.env` files and list `.env*`, `*.pem` and `*.key` files inside it; only examples and the tracked defaults appear. After the deployment, the host passes the static sync and an upload through the API is stored.
