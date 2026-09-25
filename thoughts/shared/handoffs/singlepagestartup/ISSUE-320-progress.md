---
issue_number: 320
issue_title: "Add workflow permissions, pin actions and remove unused pull-request workflows"
start_date: 2026-09-25T21:10:00Z
completed_date: 2026-09-25T21:21:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-320.md
status: complete
---

# Implementation Progress: ISSUE-320 - Add workflow permissions, pin actions and remove unused pull-request workflows

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-320.md`

## Phase Progress

### Phase 1: Pull-request workflows

- [x] Started: 2026-09-25T21:10Z
- [x] Completed: 2026-09-25T21:11Z
- [x] Automated verification: harness on `.github/workflows` parses 10/10 files and reports 0 pull-request violations (37 remaining violations belong to phases 2 and 3); `git grep -e deploy-to-icp -e update-host.yml -e update-frontend -- . ':!thoughts'` finds nothing; `npx prettier --check tools/deployer/README.md .github/workflows/deployer.yml` PASSED

**Notes**: `deploy-to-icp.yml` and `update-host.yml` deleted. `deployer.yml` gains `branches: ["ansible-*"]` under `pull_request`; the job condition, `secrets: inherit` and the `BRANCH` input are unchanged. The "GitHub Actions deployment" section of `tools/deployer/README.md` has one new paragraph on how a deployment run starts.

### Phase 2: Values out of shell script text

- [x] Started: 2026-09-25T21:11Z
- [x] Completed: 2026-09-25T21:13Z
- [x] Automated verification: harness reports 0 `run:` expressions outside secrets and `inputs.PRERELEASE` and 0 `bash -n` failures (16 remaining violations are the phase 3 pins and permissions); `node simulate.mjs` ALL CHECKS PASSED

**Notes**: `ansible.yml` has a job-level `BRANCH_NAME` from `github.ref_name`; the script-name, arguments and `chmod` steps read `"$BRANCH_NAME"`; the two steps that used step outputs receive them through step `env:`; both `GITHUB_REPOSITORY` array entries use the runner variable. The five service workflows take `IMAGE_TAG` from `inputs.TAG` at job level; `docker-image.yml` takes it at step level in "Set image tags". Simulation (scratchpad `simulate.mjs`, placeholder secrets only): for `ansible-up`, `ansible-down`, `ansible-up-preview` and `ansible-down-preview` the original and changed steps print the same script name, arguments and step log, and write the same `.env` line count, `GITHUB_REPOSITORY` and `PROJECT_NAME` lines; the webhook command lines for the tag `v1.2.3` (prerelease and release) and for a manual dispatch without inputs are identical; the image tag output is identical. With the branch name `ansible-up$(touch${IFS}pwned)` the original steps create the marker file and still run `up.sh`, while the changed steps create nothing and stop at `chmod`. With the tag `v1.2.3$(touch${IFS}pwned)` the original service and image steps create the marker file and the changed ones pass the text through unchanged.

### Phase 3: Action pins and permissions

- [x] Started: 2026-09-25T21:13Z
- [x] Completed: 2026-09-25T21:15Z
- [x] Automated verification: harness `OK: no violations` on the ten remaining files (45 violations on the original twelve); `verify-pins.sh` OK for all six pinned lines; `npx prettier --check .github/workflows/*.yml tools/deployer/README.md` PASSED; `node tools/agents/code-placement.mjs` PASSED; final `simulate.mjs` run: 21 identical comparisons, 0 differences, marker file created only by the original files

**Notes**: `actions/checkout` is pinned to `fbc6f39… # v5.1.0` in `ansible.yml` and `docker-image.yml` and to `11d5960… # v4.4.0` in `prepare-docker-images.yml`; `docker/login-action` to `dbcb813… # v4.6.0`; both `docker/build-push-action` steps to `c3c9e26… # v7.4.0`. For each pin, `gh api .../git/ref/tags/<exact>` and `.../git/ref/tags/<replaced major>` returned type `commit` with the pinned SHA, and `.../commits/<sha>` exists in the action repository. `permissions: contents: read` sits after `on:` in the ten workflows, before `concurrency:` in `release.yml`.

Mutation check: with the `github.ref_name` expression restored in the script-name step, the `ansible-*` filter removed, the login action back on `@v4` and the permissions block removed from `api.yml`, the harness reports exactly those four violations and the simulation fails because the changed files run the embedded command. Restoring the four files returns `git diff | shasum` to `37a8427c84de` and the harness to `OK`.

No Nx project owns `.github/workflows/` or `tools/deployer/README.md`, so no jest, eslint or tsc lane applies. `actionlint`, `shellcheck` and `yamllint` are not installed.

After the push, the checks on pull request #323 passed: CodeQL `Analyze (actions)`, `Analyze (javascript-typescript)`, `Analyze (python)` and Socket Security. Code scanning lists 20 open `actions/missing-workflow-permissions` alerts in `.github/workflows` on `main` and none on `refs/pull/323/merge`.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 0 -->

## Summary

### Changes Made

- Deleted `.github/workflows/deploy-to-icp.yml` and `.github/workflows/update-host.yml`.
- `.github/workflows/deployer.yml`: `branches: ["ansible-*"]` on the `pull_request` trigger; `permissions: contents: read`.
- `.github/workflows/ansible.yml`: `BRANCH_NAME` job variable, step outputs through `env:`, `GITHUB_REPOSITORY` from the runner, pinned checkout, `permissions: contents: read`.
- `.github/workflows/{api,host,llm,mcp,telegram}.yml`: `IMAGE_TAG` job variable, `permissions: contents: read`.
- `.github/workflows/docker-image.yml`: `IMAGE_TAG` in "Set image tags", three pinned actions (four lines), `permissions: contents: read`.
- `.github/workflows/prepare-docker-images.yml`: pinned checkout, `permissions: contents: read`.
- `.github/workflows/release.yml`: `permissions: contents: read`.
- `tools/deployer/README.md`: how a GitHub Actions deployment starts.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/323
- [x] PR number: 323

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T21:21:00Z
