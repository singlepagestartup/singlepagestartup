---
date: 2026-09-26T00:40:00+03:00
issue_number: 317
repository: singlepagestartup
topic: "Complete the Docker ignore list, pin base images and run as a non-root user"
status: approved
---

# Docker Build Context, Pinned Images and Non-Root Runtime Implementation Plan

## Overview

Keep credentials out of every image build context, pin the base images and Bun
to the versions the image uses today, and run the application image as the
base image's `node` user, with the deployer giving that user the two server
mounts it writes.

## Current State Analysis

- `.dockerignore` excludes env files for db, redis and host only; live
  `apps/api/.env`, `apps/mcp/.env`, `apps/telegram/.env`, `apps/llm/.env`,
  `apps/openapi/.env`, root `.env*`, `.agents/.env` and everything under
  `tools/deployer` reach a locally built image through `Dockerfile:30`
  `COPY . .` (research: "Build context of the root image").
- Four tracked, non-example env files are part of the build and must stay:
  `apps/api/.env.production`, `apps/host/.env.production` (the Dockerfile
  appends to it), `apps/host/.env.development`, `apps/mcp/.env.production`.
- `FROM node:24` is Node 24.21.0 on bookworm today; `redis:latest` is Redis
  8.10.2 on trixie. The Bun installer takes the newest release, while the
  services run the lockfile's Bun 1.2.5 from `node_modules/.bin`.
- The image runs as root; `chmod -R 777` opens `apps/host/public`. At runtime
  the services write the app directories, the workspace root (`.nx`),
  `apps/host/.next`, the `next_static` volume and the upload bind mount.
- `apps/llm` has no `.dockerignore`, and `apps/llm/up.sh` rebuilds its image
  with `apps/llm/.env` inside on every start.

## Desired End State

- A Docker build from a bootstrapped checkout contains no live env file, no key
  material, nothing from `.agents` and nothing from `tools/deployer` except the
  two helpers the app scripts source. Examples and the four tracked defaults
  remain.
- `Dockerfile` resolves `node:24.21.0-bookworm` and Bun 1.2.5 and fails the
  build when Bun is missing or reports another version; `apps/redis/Dockerfile`
  resolves `redis:8.10.2-trixie`.
- The image runs as `node` (uid 1000, gid 1000) and owns `/usr/src/app`; no
  `chmod 777` remains.
- `create_api.yaml` leaves `/home/code/api_data` owned by 1000:1000 and
  `create_host.yaml` gives an existing `host_next_static` volume to 1000:1000
  before it deploys the stack. `tools/deployer/README.md` states the runtime
  user and the one-time ownership step for servers that already run the stack.
- The local LLM image leaves `apps/llm/.env*` (except the example), `.venv` and
  `.ollama` out of its context.

Verification: the context checks, the Dockerfile mechanics build and the
runtime checks in **Testing Strategy**.

### Key Discoveries:

- `node:24.21.0-bookworm` has the same index digest as today's `node:24`
  (`sha256:64af3819...`), so the pin changes no byte of the base image.
- `/root` is mode `0700` in the base image; Bun has to move out of `/root/.bun`
  for uid 1000 to run it. `BUN_INSTALL=/usr/local` puts it in `/usr/local/bin`,
  already on `PATH`.
- A root-owned `next_static` volume makes `tools/runtime/sync-next-static.mjs`
  fail with `EACCES`, and `start.sh` stops under `set -euo pipefail`; a new
  volume is filled from the image with the image's owner.
- BuildKit re-includes files inside an excluded directory
  (`tools/deployer` then `!tools/deployer/get_env.sh`), and a directory rule
  placed after `!**/.env.example` drops that directory's example again.
- The deployer escapes Docker format strings with `{% raw %}` and uses
  `recurse: yes` on `file` tasks already.

## What We're NOT Doing

- No change to the deployer compose templates: commands, ports, `user:` keys
  and the floating image references there (`redis`, `pgvector/pgvector:pg17`,
  `ollama/ollama:latest`, Portainer, `nginx:alpine`) stay as they are. #319
  owns the deployer hardening, and those images sit outside SEC-26 and the
  Docker image row of N-10.
- No pin for `apps/db/Dockerfile` (`pgvector/pgvector:pg17`): a PostgreSQL
  image pin belongs with the production template, so the local and production
  pgvector extension versions move together.
- No `USER` and no base pin in `apps/llm/Dockerfile`: its compose file mounts
  the model cache at `/root/.cache/huggingface`, so a user change there would
  also move that volume. Production runs the LLM service from the root image,
  which does switch user.
- No removal of the global Bun: `docker exec` sessions and scripts outside npm
  still find `bun`. It is pinned to the lockfile's version instead.
- No digest pins: without Dependabot a digest would go stale silently, while an
  official image's version tag keeps receiving base-OS rebuilds. Bumping the
  tags stays a manual step.
- No dedicated high uid: the base image's `node` user is the conventional
  runtime user, and the deployer only needs a number that matches.
- No change to `.devcontainer`, `.gitpod.Dockerfile` or
  `tools/deployer/icp/Dockerfile`: development and ICP tooling, not the
  application image.
- No TypeScript or runtime-script change, so no unit lane changes; the
  regression checks are Docker builds recorded in the progress file.

## Implementation Approach

A file that never enters the build context cannot reach any layer, so the root
`.dockerignore` gets one "Secrets" section that denies every env file and key
file anywhere, then re-includes examples and the four tracked defaults by name. Directory
rules for `.agents` and `tools/deployer` come after it, so an example inside
those directories stays out too. The per-app env and key lines become
redundant and are removed, leaving the app sections for build output and data.

The image keeps its single-stage shape. The base tag and the Bun release are
pinned to what already runs, the Bun install moves to `/usr/local`, and the
build switches to `node` before `COPY --chown=node:node`, so every file the
build writes, and every directory the services write at runtime, belongs to
the runtime user. The runtime user owns the whole tree because the services
write into the workspace root, four app directories and `.next`; a path left
to root breaks the service that writes it.

Existing servers hold root-owned data in the two mounts. The plays set the
owner where they already prepare server state, and the README gives the
one-time commands for servers that only receive new images through webhooks.

Use cases that must keep working: all five services start from the same image
through `start.sh`; the API accepts uploads into the bind mount; the host keeps
earlier static chunks in `next_static`; `migrate.sh seed` runs Nx at runtime;
the development branch of `create_env.sh` still finds its two deployer
helpers; CI builds and pushes the image from a clean checkout.

## Phase 1: Build context

### Overview

Every Docker build context the repository defines leaves credentials out.

### Changes Required:

#### 1. Root ignore list

**File**: `.dockerignore`
**Why**: `COPY . .` sends the whole checkout, and only three apps have env
rules today.
**Changes**: add a "Secrets" section after "Git": deny `**/.env*`, `**/*.env`,
`**/*.env.*`, `**/*.pem`, `**/*.pem.base64`, `**/*.key`, `**/*-wallet.txt`;
re-include `**/.env.example`, `**/*.env.example`, `apps/api/.env.production`,
`apps/host/.env.development`, `apps/host/.env.production`,
`apps/mcp/.env.production`. Add `.agents` to "AI development artifacts". Add a
"Deployer" section at the end: `tools/deployer`, then
`!tools/deployer/get_env.sh` and `!tools/deployer/generate_secret.sh`. Remove
the db, redis and host env and key lines that the new section covers.

#### 2. LLM ignore list

**File**: `apps/llm/.dockerignore` (new, beside the host, db and redis ones)
**Why**: `apps/llm/Dockerfile:15` copies `apps/llm` with its `.env`.
**Changes**: deny `.env*` except `.env.example`, and the local `.venv` and
`.ollama` directories, in the banner style of the sibling files.

### Success Criteria:

#### Automated Verification:

- [x] Fixture context with the old rules lists the leaked paths; with the new
      rules it lists only examples, the four defaults and the two helpers.
- [x] Worktree context (`FROM alpine`, `COPY . /ctx`, `find` for `.env*`,
      `*.env`, `*.pem`, `*.key`, `inventory.yaml*`) lists only examples and the
      four defaults; `/ctx/tools/deployer` holds only the two helpers; `/ctx/.agents`
      does not exist.
- [x] `apps/llm` context lists `.env.example` and no other env file.

#### Manual Verification:

- [x] None beyond the automated checks.

---

## Phase 2: Image

### Overview

Pinned base images and Bun, and a non-root runtime user that owns the tree.

### Changes Required:

#### 1. Application image

**File**: `Dockerfile`
**Why**: floating `node:24`, an unpinned Bun under `/root`, no `USER`, and
`chmod -R 777` on `apps/host/public`.
**Changes**: `FROM node:24.21.0-bookworm`; `ARG BUN_VERSION=1.2.5` with a note
to keep it in step with `package-lock.json`; run the installer with
`BUN_INSTALL=/usr/local` and the argument `bun-v$BUN_VERSION`, then fail unless
`bun --version` prints that version; drop the `/root/.bun/bin` `PATH` entry;
after `WORKDIR`, give `/usr/src/app` to `node` and switch to `USER node`;
`COPY --chown=node:node . .`; delete both `chmod 777` lines.

#### 2. Local Redis image

**File**: `apps/redis/Dockerfile`
**Why**: `redis:latest`.
**Changes**: `FROM redis:8.10.2-trixie`, the build `latest` resolves to today.

### Success Criteria:

#### Automated Verification:

- [x] `docker build --check .` reports no warnings.
- [x] The real `Dockerfile` builds with a minimal context; in the result `id`
      is uid 1000, `bun --version` prints `1.2.5`, `/usr/src/app` and
      `apps/host/public` belong to `node`.
- [x] As uid 1000 the image writes the four runtime env files with mode `600`,
      creates `.nx`, writes into `apps/api/public/file-storage/dynamic` and
      `apps/host/public`.
- [x] The static sync passes on a new volume, fails with `EACCES` on a
      root-owned one, and passes after `chown -R 1000:1000`.
- [x] `docker build apps/redis` produces `redis-server` 8.10.2.
- [ ] A full build of the real image. Not run: the local Docker VM has 3.8 GB
      of memory; the real `Dockerfile` up to the host build (`npm ci` and the
      venv as uid 1000) passed on the real context instead.

#### Manual Verification:

- [x] None beyond the automated checks.

---

## Phase 3: Server ownership and documentation

### Overview

The deployer gives the runtime user the two mounts, and the README documents
the user and the one-time step for running servers.

### Changes Required:

#### 1. Upload directory

**File**: `tools/deployer/api/create_api.yaml`
**Why**: the play creates `/home/code/api_data` as root, and uploads land there
through the bind mount.
**Changes**: the existing `file` task sets owner and group `1000`, recursively.

#### 2. Static volume

**File**: `tools/deployer/host/create_host.yaml`
**Why**: an existing `host_next_static` volume holds root-owned chunks, and the
sync as uid 1000 fails on them.
**Changes**: before `Run host service`, read the volume's mount point with
`docker volume inspect` (tolerating a missing volume) and, when it exists, set
owner and group `1000` recursively with the `file` module.

#### 3. Deployer documentation

**File**: `tools/deployer/README.md`
**Why**: the operator needs the uid, the one-time step and the local compose
note; the "Docker images" bullet under the rotation section describes the old
ignore list.
**Changes**: a "Container user" section after "Docker image rollout"; the
bullet rewritten to the current ignore list.

### Success Criteria:

#### Automated Verification:

- [x] `ansible-playbook --syntax-check` passes for both plays.
- [x] `docker volume inspect --format '{{ .Mountpoint }}'` returns a path for an
      existing volume and fails for a missing one.

#### Manual Verification:

- [ ] On a running server, the ownership step before the first release that
      runs as uid 1000 (operator action, listed in the final report).

---

## Testing Strategy

### Unit Tests:

- None: no TypeScript, JavaScript or Python changes.

### Integration Tests:

- Context listing builds for the fixture (old and new rules), the worktree and
  `apps/llm`. Running the old rules against the fixture is the mutation check:
  without the new section the leaked paths return.
- The real `Dockerfile` built on a minimal context, then runtime checks as
  uid 1000, including the three volume cases.

### Manual Testing Steps:

1. Build the image from a checkout that holds live `.env` files and list
   `find / -name '.env*'` inside it: only examples and the four defaults.
2. On a server, run the two ownership commands from the README, deploy a
   release, and upload a file through the API.

## Performance Considerations

`COPY --chown` adds no layer. The smaller context shortens local builds a
little; CI context size is unchanged because a clean checkout holds no local
files.

## Migration Notes

- Servers that already run the stacks: chown `/home/code/api_data` and the
  `host_next_static` volume to 1000:1000 before the first release that runs as
  uid 1000, or re-run `./api.sh up` and `./host.sh up`.
- Local compose: the root `docker-compose.yaml` volume `host_next_static` from
  an older image needs the same chown, or removal.
- Downstream projects: tracked env files the image needs beyond the four
  defaults need a `!` exception; Dockerfile steps that need root go before
  `USER node`; other mounts the image writes need uid 1000.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-317.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-317.md`
- Findings: SEC-26 and N-10 in `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`
