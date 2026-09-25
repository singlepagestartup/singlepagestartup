---
issue_number: 317
issue_title: "Complete the Docker ignore list, pin base images and run as a non-root user"
start_date: 2026-09-25T21:45:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-317.md
status: in_progress
---

# Implementation Progress: ISSUE-317 - Complete the Docker ignore list, pin base images and run as a non-root user

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-317.md`

## Phase Progress

### Phase 1: Build context

- [x] Started: 2026-09-25T21:45:00Z
- [x] Completed: 2026-09-25T22:05:00Z
- [x] Automated verification: PASSED

**Notes**:

- `.dockerignore`: "Secrets" section after "Git" (deny `**/.env*`, `**/*.env`, `**/*.env.*`, `**/*.pem`, `**/*.pem.base64`, `**/*.key`, `**/*-wallet.txt`; re-include `**/.env.example`, `**/*.env.example` and the four tracked defaults), `.agents` added to "AI development artifacts", "Deployer" section at the end (`tools/deployer` with `get_env.sh` and `generate_secret.sh` re-included), redundant db, redis and host env and key lines removed.
- `apps/llm/.dockerignore` (new): `.env*` except `.env.example`, `.venv`, `.ollama`.
- Fixture context (63 placeholder files, `FROM alpine:3.22`, `COPY . /ctx`, `find . -type f`): the committed rules keep 48 files including root `.env`, `.env.local`, `.agents/.env`, `apps/{api,llm,mcp,openapi,telegram}/.env`, `apps/api/.env.local`, `tools/deployer/{.env,.env.preview,inventory.yaml,inventory.preview.yaml,rsa.pem,certs/origin.key,iams/iam.env,aws/production.env}` and `libs/modules/example/certs/client.key`. The new rules keep 23 files: examples, the four tracked defaults, app code, `tools/runtime/sync-next-static.mjs` and the two deployer helpers. `comm` shows 25 removed and 0 added. Running the committed rules is the mutation check: without the new section the leaked paths return.
- Worktree context (`FROM alpine:3.22`, `COPY . /ctx`, `find /ctx -name '.env*' -o -name '*.env' -o -name '*.pem' -o -name '*.key' -o -name 'inventory.yaml*'`), context transfer 49.28 MB: `apps/api/.env.production`, `apps/db/.env.example`, `apps/host/.env.development`, `apps/host/.env.production`, `apps/llm/.env.example`, `apps/mcp/.env.production`, `apps/openapi/.env.example`, `apps/redis/.env.example`, `apps/telegram/.env.example`. `/ctx/tools/deployer` holds `generate_secret.sh` and `get_env.sh` only; `/ctx/.agents` and `/ctx/.claude` do not exist. The worktree holds live `.env` files for api, db, llm, mcp, openapi, redis, telegram, `.agents` and `.claude`; none reached the image.
- `apps/llm` context: fixture keeps `.env.example`, `main.py`, `requirements.txt`, `routers/audio.py` and drops `.env`, `.env.local`, `.env.testing`, `.venv`, `.ollama`; the real directory (38 files) holds `.env.example` as its only env file.

### Phase 2: Image

- [x] Started: 2026-09-25T22:05:00Z
- [x] Completed: 2026-09-25T22:40:00Z
- [x] Automated verification: PASSED

**Notes**:

- `Dockerfile`: `FROM node:24.21.0-bookworm`; `ARG BUN_VERSION=1.2.5`; installer run with `BUN_INSTALL=/usr/local` and `bun-v$BUN_VERSION`, then `test "$(bun --version)" = "$BUN_VERSION"`; `/root/.bun/bin` `PATH` entry removed; `RUN chown node:node /usr/src/app` and `USER node` after `WORKDIR`; `COPY --chown=node:node . .`; the commented and the active `chmod -R 777` lines removed.
- `apps/redis/Dockerfile`: `FROM redis:8.10.2-trixie`.
- `docker build --check .` (worktree context) and `docker build --check apps/redis`: "Check complete, no warnings found." for both.
- The real `Dockerfile` on a minimal context (real `start.sh`, `migrate.sh`, `create_env.sh`, `tools/runtime/sync-next-static.mjs`, `apps/llm/requirements.txt`, `apps/host/.env.production`; a `package.json` whose `host:build` writes `.next/static`), with `--build-arg NEXT_PUBLIC_API_SERVICE_URL`: all 15 steps pass; the installer reports `/usr/local/bin/bun` and the version test passes.
- Runtime checks on that image: `id` is `uid=1000(node) gid=1000(node)`; `bun` is `/usr/local/bin/bun` 1.2.5; `find /usr/src/app -not -user node` finds 0 files; the build argument line is appended to `apps/host/.env.production`; `./start.sh` without a role prints the usage and exits 1; `./create_env.sh <api|telegram|mcp|host> deployment` writes `apps/api/.env`, `apps/telegram/.env`, `apps/mcp/.env`, `apps/host/.env.local` owned by `node` with mode `600`; `.nx/workspace-data`, `apps/api/public/file-storage/dynamic/upload.png`, a `/tmp` directory and `$HOME/.cache/huggingface` (`HOME=/home/node`) are writable; `apps/llm/.venv/bin/uvicorn --version` runs.
- Mount cases as uid 1000: a new `next_static` volume is filled as `node:node` and the sync passes (exit 0); a volume written by a root container fails with `EACCES: permission denied, unlink '.../chunks/main.js'` (exit 1); after `chown -R 1000:1000` the sync passes and keeps `previous-release.js`. A root-owned upload mount rejects a write (exit 2) and a delete (exit 1); after the `chown` both pass.
- `docker build apps/redis`: `Redis server v=8.10.2`.
- Real `Dockerfile` lines 1-49 (`sed -n '1,49p'`, `cmp` identical to the head of the file: everything before `npm run host:build`) built on the real worktree context: `npm ci` as uid 1000 "added 3033 packages" in 530.5 s with husky's `prepare` printing ".git can't be found" as before; the venv step installed the LLM requirements in 45.9 s; exit 0.
- Checks on that image: `id` is uid 1000; `bun` on the plain `PATH` is `/usr/local/bin/bun` 1.2.5, `npm run env` puts `/usr/src/app/node_modules/.bin` first, and `node_modules/.bin/bun --version` is 1.2.5. Every file `start.sh`, `migrate.sh` and `create_env.sh` reference is present, including `tools/deployer/get_env.sh`, `tools/deployer/generate_secret.sh`, `apps/llm/.venv/bin/uvicorn` and every `apps/*/create_env.sh`; sourcing both helpers and calling `generate_secret 16` prints 32 characters. Secret-shaped files under `/usr/src/app` outside `node_modules`: the six examples, the four tracked defaults and two public `certifi/cacert.pem` bundles installed by pip. `tools/deployer` holds the two helpers; `.agents`, `.claude` and `thoughts` are absent; `find /usr/src/app -not -user node` finds 0 files.
- Nx as uid 1000 (`NX_DAEMON=false npx nx show projects --with-target repository-migrate`): exit 0, 16 projects, every `@sps/*:repository-migrate` in `migrate.sh` present, plus `@sps/rbac:repository-natural-key-repair-apply` and `api:db:seed`; `.nx` and `.nx/workspace-data` are created as `node:node`.
- Real upload path as uid 1000: a scratch Bun script run from `apps/api` builds `new Provider({ type: FILE_STORAGE_PROVIDER, folder: FILE_STORAGE_FOLDER })` the way the upload controller does, with `local` and `file-storage/dynamic`. Without a mount it creates the folder, stores the file with uid 1000 and deletes it. On a root-owned volume mounted at the folder it fails with `EACCES: permission denied, open '.../dynamic/<name>.txt'`. After `chown -R 1000:1000` it stores and deletes.
- The full image build (`npm run host:build`) was not run: the Docker VM has 3.8 GB of memory, the repository notes a 12 GB heap for the host build, and the daemon also runs the PostgreSQL and Redis containers other agents share.
- All `sps-issue-317-*` test images and `sps317_*` volumes were removed afterwards.

### Phase 3: Server ownership and documentation

- [x] Started: 2026-09-25T22:25:00Z
- [x] Completed: 2026-09-25T22:45:00Z
- [x] Automated verification: PASSED

**Notes**:

- `tools/deployer/api/create_api.yaml`: the `Create api_data directory` task sets `owner: "1000"`, `group: "1000"`, `recurse: yes`.
- `tools/deployer/host/create_host.yaml`: `Find next_static volume` (`docker volume inspect --format '{% raw %}{{ .Mountpoint }}{% endraw %}' host_next_static`, `failed_when: false`, `changed_when: false`) and `Give next_static volume to the image user` (`file`, owner and group `1000`, `recurse: yes`, `when: next_static_volume.rc == 0`) before `Run host service`.
- `tools/deployer/README.md`: "Container user" section before "Next.js deployment skew protection"; the "Docker images" bullet under "Four copies survive a rotation" rewritten for the new ignore list.
- `ansible-playbook --syntax-check -i localhost, api/create_api.yaml` and `host/create_host.yaml` (from `tools/deployer`): both print the playbook name with no error.
- The `Find next_static volume` task, extracted verbatim from the play and run with `connection: local` against the local Docker: missing volume gives `rc=1 changed=False failed=False` and an empty mount point; an existing volume gives `rc=0` and `/var/lib/docker/volumes/host_next_static/_data`. The test volume was created and removed by the check; `docker events` shows no other volume of that name.
- The `file` task cannot run against Docker Desktop from macOS (the mount point is inside the VM); its effect, `chown -R 1000:1000` on the volume and the upload mount, is covered by the Phase 2 mount cases.
- `npx prettier --check tools/deployer/README.md`: clean. `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — Docker arguments kept in one shell variable

- **Occurrences**: 1
- **Stage**: Phase 2 - Image
- **Symptom**: `docker run --rm $RUNARGS ...` answered `Module not found "upload-check.ts"`, then printed the `docker run` usage.
- **Root Cause**: the Bash tool runs zsh, which does not word-split an unquoted variable, so `-e ... -w ...` reached Docker as one argument and the working directory was never set.
- **Fix**: pass each Docker option literally and stream the script into the container over stdin.
- **Reusable Pattern**: in this environment, write Docker options out in full or use an array; do not collect several options in one string variable.

## Summary

### Changes Made

- `.dockerignore`: "Secrets" section with named exceptions for the examples and the four tracked defaults; `.agents` in the AI section; "Deployer" section keeping `get_env.sh` and `generate_secret.sh`; per-app env and key lines removed.
- `apps/llm/.dockerignore` (new): `.env*` except the example, `.venv`, `.ollama`.
- `Dockerfile`: `node:24.21.0-bookworm`, Bun 1.2.5 in `/usr/local` with a version check, `USER node`, `COPY --chown=node:node`, no `chmod 777`.
- `apps/redis/Dockerfile`: `redis:8.10.2-trixie`.
- `tools/deployer/api/create_api.yaml`: `/home/code/api_data` owned by 1000:1000, recursively.
- `tools/deployer/host/create_host.yaml`: an existing `host_next_static` volume is handed to 1000:1000 before the stack deploy.
- `tools/deployer/README.md`: "Container user" section and the updated "Docker images" bullet.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T23:10:00Z
