---
issue_number: 317
issue_title: "Complete the Docker ignore list, pin base images and run as a non-root user"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T23:10:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-317 - Complete the Docker ignore list, pin base images and run as a non-root user

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: implement the three plan phases and record evidence in `thoughts/shared/handoffs/singlepagestartup/ISSUE-317-progress.md`

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings SEC-26, N-10. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: every ticket claim holds against `78d7d43125`. Additional facts: four tracked non-example env files are part of the build; the services run the lockfile's Bun 1.2.5 from `node_modules/.bin`, not the global install; `/root` is mode `0700`; a root-owned `next_static` volume stops the host start as uid 1000; nothing writes `apps/host/public` at runtime; `apps/llm` has no `.dockerignore`.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-317.md`.
- Notes: base tags resolved with `docker buildx imagetools inspect` (no pull needed); a fixture context with placeholder files proved the leak without sending live values to Docker. A sub-agent reported that runtime `bun` resolves through `/root/.bun/bin`; `npm run env`, `npx -c` and the Nx `run-commands` source show `node_modules/.bin` first, so that claim was corrected before planning.

### Plan

- Summary: one "Secrets" section in the root `.dockerignore` with named exceptions for the tracked defaults, directory rules for `.agents` and `tools/deployer`, an `apps/llm/.dockerignore`; pinned `node:24.21.0-bookworm`, Bun 1.2.5 in `/usr/local` and `redis:8.10.2-trixie`; `USER node` with `COPY --chown`; ownership of `/home/code/api_data` and `host_next_static` in the plays and the README. Plan approval is delegated to the issue agent for this wave.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-317.md`.
- Notes: the deployer compose templates, `apps/db/Dockerfile` and `apps/llm/Dockerfile` stay unchanged; the plan lists the reasons.

### Implement

- Summary: the three plan phases are implemented and verified with Docker builds: fixture and worktree contexts, the real `Dockerfile` on a minimal context, the real `Dockerfile` up to the host build on the real context (`npm ci` and the venv as uid 1000), Nx and the upload provider as uid 1000, the three mount cases, the Redis image, and the plays' syntax and volume lookup. The full image build with `npm run host:build` was not run locally because of the Docker VM's memory.
- Outputs: `.dockerignore`, `apps/llm/.dockerignore`, `Dockerfile`, `apps/redis/Dockerfile`, `tools/deployer/api/create_api.yaml`, `tools/deployer/host/create_host.yaml`, `tools/deployer/README.md`; evidence in `thoughts/shared/handoffs/singlepagestartup/ISSUE-317-progress.md`.
- Notes: the ownership step on running servers is an operator action before the first release that runs as `node`.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — "Every `.env*` except examples" would drop files the build reads

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: the ticket asks the ignore list to cover every `.env*` file except examples, but `git ls-files` lists four tracked non-example env files: `apps/api/.env.production`, `apps/host/.env.production`, `apps/host/.env.development`, `apps/mcp/.env.production`.
- **Root Cause**: the tracked `.env.production` files carry secret-free defaults; `Dockerfile:33-37` appends build arguments to `apps/host/.env.production`, and `create_env.sh:13-26` copies it into the host's runtime `.env.local`.
- **Fix**: deny `**/.env*` and re-include the examples and the four tracked files by name.
- **Preventive Action**: before a blanket ignore rule, list the tracked files it matches with `git ls-files` and decide each one.
- **References**: `.dockerignore`, `thoughts/shared/research/singlepagestartup/ISSUE-317.md` ("Build context of the root image").

### Incident 2 — Docker arguments kept in one shell variable

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `docker run --rm $RUNARGS ...` answered `Module not found "upload-check.ts"`, then printed the `docker run` usage.
- **Root Cause**: the Bash tool runs zsh, which does not word-split an unquoted variable, so several Docker options reached Docker as one argument.
- **Fix**: pass each Docker option literally and stream the script into the container over stdin.
- **Preventive Action**: write Docker options out in full or use an array in zsh.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-317-progress.md` (Incident 1).

## Reusable Learnings

- Prove a Docker ignore rule on a fixture context with placeholder files at the sensitive paths (`FROM alpine`, `COPY . /ctx`, list the files) before building the real checkout, so a wrong rule never sends a live value to the Docker daemon.
- `docker buildx imagetools inspect <tag> --format '{{json .Manifest.Digest}}'` resolves which full version a floating tag points at without pulling it.
