---
date: 2026-09-26T00:09:00+03:00
issue_number: 320
repository: singlepagestartup
topic: "Add workflow permissions, pin actions and remove unused pull-request workflows"
status: approved
approval: delegated to the issue agent by the security wave instructions
---

# Workflow Permissions, Action Pins and Pull-Request Triggers Implementation Plan

## Overview

Pin the seven third-party action references in `.github/workflows/` to the commits their tags point at, delete the two pull-request workflows whose branches no longer exist, limit the deployment trigger to the branches it serves, keep branch names and release tags out of shell script text, and declare `permissions: contents: read` in every remaining workflow.

## Current State Analysis

The research document `thoughts/shared/research/singlepagestartup/ISSUE-320.md` holds the evidence. In short:

- Twelve workflows, none with `permissions:`. Seven third-party `uses:` lines reference `actions/checkout@v5`, `actions/checkout@v4`, `docker/login-action@v4` and `docker/build-push-action@v7`.
- `deploy-to-icp.yml` and `update-host.yml` listen for pull requests closed into `deploy-to-icp` and `update-frontend`. Both branches are gone, neither workflow checks `merged`, and neither has a recorded run.
- `deployer.yml` starts every deployment. When a pull request from `main` into `ansible-up`, `ansible-down`, `ansible-up-preview` or `ansible-down-preview` merges, `github.ref_name` is that branch and `ansible.yml` runs `up.sh` or `down.sh` with the matching secret set. Because it has no branch filter, every other closed pull request also starts it and ends as a skipped run.
- `ansible.yml` renders `github.ref_name`, two step outputs derived from it, `github.repository_owner` and `github.event.repository.name` into shell text. The five service workflows and `docker-image.yml` render `inputs.TAG`, which carries the release tag. `prepare-docker-images.yml` already passes that input through `env: IMAGE_TAG`.
- No workflow writes to the repository through the `GITHUB_TOKEN`; only `actions/checkout` uses it, to read.

## Desired End State

Ten workflows remain. Each declares `permissions: contents: read` at the top. Each third-party `uses:` reads `owner/repo@<40-hex commit> # vX.Y.Z`, where the commit is both the one the replaced major tag points at and the one the exact release tag points at. `deployer.yml` starts only for pull requests into `ansible-*` branches, and its job still requires a merge. No `run:` script contains a `github.*` expression, a step output or `inputs.TAG`; the only expressions left in `run:` are secrets and the boolean `inputs.PRERELEASE`. The "GitHub Actions deployment" section of `tools/deployer/README.md` says how a deployment run starts.

Verification: the scratchpad harness reports no violation against the new tree and 45 against the original one; every `run:` script passes `bash -n`; a simulation of the changed steps prints the same script name, arguments, `.env` line, webhook URL and image references as the original for ordinary branch names and tags, and runs nothing for a branch name that contains a command substitution; `gh api` confirms each pinned commit; `prettier --check` passes.

### Workflow permissions

| Workflow                    | Trigger                                                                  | Permission it needs                                                     | Permission set   |
| --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------------- |
| `release.yml`               | `release`: `released`, `prereleased`                                     | `contents: read`, passed on to the workflows it calls                   | `contents: read` |
| `docker-image.yml`          | `workflow_dispatch`, `workflow_call`                                     | `contents: read` for `actions/checkout`; Docker Hub via secrets         | `contents: read` |
| `prepare-docker-images.yml` | `workflow_dispatch`, `workflow_call`                                     | `contents: read` for `actions/checkout`; Portainer via secrets          | `contents: read` |
| `api.yml`                   | `workflow_dispatch`, `workflow_call`                                     | none; one `curl` to a webhook held in a secret                          | `contents: read` |
| `host.yml`                  | `workflow_dispatch`, `workflow_call`                                     | none; one `curl` to a webhook held in a secret                          | `contents: read` |
| `llm.yml`                   | `workflow_dispatch`, `workflow_call`                                     | none; one `curl` to a webhook held in a secret                          | `contents: read` |
| `mcp.yml`                   | `workflow_dispatch`, `workflow_call`                                     | none; one `curl` to a webhook held in a secret                          | `contents: read` |
| `telegram.yml`              | `workflow_dispatch`, `workflow_call`                                     | none; one `curl` to a webhook held in a secret                          | `contents: read` |
| `ansible.yml`               | `workflow_dispatch`, `workflow_call`                                     | `contents: read` for `actions/checkout`; SSH and `GH_TOKEN` via secrets | `contents: read` |
| `deployer.yml`              | `pull_request`: `closed` into `ansible-*`, job requires `merged == true` | `contents: read`, passed on to `ansible.yml`                            | `contents: read` |
| `deploy-to-icp.yml`         | `pull_request`: `closed` into `deploy-to-icp` (branch absent)            | —                                                                       | file deleted     |
| `update-host.yml`           | `pull_request`: `closed` into `update-frontend` (branch absent)          | —                                                                       | file deleted     |

The five service workflows use no token. They declare `contents: read`, the same baseline as the rest of the release chain; a called workflow may keep or narrow what its caller grants.

### Key Discoveries:

- For a merged pull request, `GITHUB_REF` is the branch it was merged into (GitHub Actions reference, `pull_request` notes); run 19761939787 for pull request #130 into `ansible-up` started the `ansible.yml` job.
- `tools/deployer/github_deployer.sh:245-256` names the deployment branches `ansible-up`, `ansible-down` and `ansible-{up,down}-<environment>`, so the glob `ansible-*` matches every name the tooling creates.
- `prepare-docker-images.yml:70-73` is the existing pattern for passing a workflow input to a script through `env:`.
- `ansible.yml:126` and `:245` build the value that the runner already exports as `GITHUB_REPOSITORY`.
- `tools/deployer/get_env.sh:3-25` reads deployer values only from the `.env` file, so a job-level `BRANCH_NAME` variable cannot change what the deployer scripts read; no deployer script reads `BRANCH_NAME` from its environment (`github_deployer.sh:270` and `github_releaser.sh:51` assign it before use, and neither runs in this workflow).
- A called workflow can only narrow the token permissions of its caller (GitHub reusable-workflow reference).

## What We're NOT Doing

- Repository and organization settings are not part of this change.
- No `write` scope is added anywhere: no remaining workflow writes through the `GITHUB_TOKEN`.
- Secrets stay rendered into `run:` in `ansible.yml`, `docker-image.yml` and `prepare-docker-images.yml`. Their values are set by the repository owner, and moving the two secret arrays of `ansible.yml` into `env:` would rewrite about 220 lines of deployment configuration.
- No action is upgraded. `prepare-docker-images.yml` keeps `actions/checkout` v4, pinned to `v4.4.0`; the others keep their major versions.
- No Dependabot configuration for action updates.
- The script selection in `ansible.yml` stays as it is: the unused `BRANCH` input, the printed arguments that are not passed to the script, and the `contains(github.ref_name, '-preview')` conditions, which are expressions and never reach the shell.
- `tools/deployer/github_releaser.sh`, which still creates `update-host` branches, and the scripts in `tools/deployer/icp/` stay unchanged.
- No spec file. The change is workflow configuration, the repository's BDD convention rules out tests that read source text (`README.md`, "Testing Convention", item 7), and no test lane covers `.github/`. The one-off harness lives in the session scratchpad, as `.agents/contracts/engineering/code-placement.md` places one-off analysis.
- No branch on the remote is pushed to except this issue's own branch; the deployment branches pick up the new files through the owner's usual pull request from `main`.

### Use cases that keep working

- A published release or prerelease runs `release.yml`: image build and push, image pull through Portainer, then the five service webhooks. Job graph, inputs, secrets and `concurrency` are unchanged; each called workflow gets `contents: read`, which is all it uses.
- Manual runs of `docker-image.yml`, `prepare-docker-images.yml` (with its `TAG` and `PRERELEASE` inputs), the five service workflows and `ansible.yml` keep their `workflow_dispatch` triggers.
- Merging a pull request from `main` into `ansible-up`, `ansible-down`, `ansible-up-preview` or `ansible-down-preview` still runs `up.sh` or `down.sh` with the matching secret set; the simulation checks the script name, the arguments and the `GITHUB_REPOSITORY` line for each of the four names.
- Local deployment from `tools/deployer` does not touch the workflows.

## Implementation Approach

Change each file as little as the finding requires and copy the patterns the files already use: `env: IMAGE_TAG` from `prepare-docker-images.yml`, top-level keys in the order `name`, `on`, `permissions`, `concurrency`, `jobs`, and a trailing `# vX.Y.Z` comment that Dependabot and Renovate read when they update a pinned action.

## Phase 1: Pull-request workflows

### Overview

Remove the two workflows that serve no branch and make the deployment trigger listen only to the branches it deploys from.

### Changes Required:

#### 1. Unused pull-request workflows

**Files**: `.github/workflows/deploy-to-icp.yml`, `.github/workflows/update-host.yml`
**Why**: their trigger branches `deploy-to-icp` and `update-frontend` do not exist, they have no `merged` guard, the ICP job runs paths that are absent from the repository, and the release flow already rebuilds the host.
**Changes**: delete both files. `docker-image.yml`, `prepare-docker-images.yml` and `host.yml`, which `update-host.yml` called, stay in use by `release.yml`.

#### 2. Deployment trigger

**File**: `.github/workflows/deployer.yml`
**Why**: every closed pull request in the repository starts it today; only merged pull requests into `ansible-*` branches deploy.
**Changes**: add a `branches` filter with `ansible-*` under the `pull_request` trigger. Keep `types: [closed]`, the job condition with `merged == true`, `secrets: inherit` and the `BRANCH` input.

#### 3. Deployer documentation

**File**: `tools/deployer/README.md` ("GitHub Actions deployment")
**Why**: the section lists the SSH secrets and does not say how a run starts.
**Changes**: one paragraph: merging a pull request from `main` into a branch created by `github_deployer.sh` runs the deployment; the second segment of the branch name selects the script and `-preview` selects the `PREVIEW_` secrets; closing without a merge deploys nothing; a manual run has to start from one of those branches.

### Success Criteria:

#### Automated Verification:

- [x] The harness reports no pull-request violation and both files are absent.
- [x] `git grep` finds no reference to the deleted files outside `thoughts/`.
- [x] `npx prettier --check` passes for the changed YAML and Markdown files.

#### Manual Verification:

- [ ] After merge, closing a pull request into `main` creates no `Env` run, and the next merged pull request into an `ansible-*` branch starts one (owner, on the next deployment).

---

## Phase 2: Values out of shell script text

### Overview

Pass branch names, step outputs and release tags to scripts as environment variables and quote them, so the shell never parses them as code.

### Changes Required:

#### 1. Deployment workflow

**File**: `.github/workflows/ansible.yml`
**Why**: lines 24, 27 and 273 render `github.ref_name` into the script unquoted, lines 30-31 and 276 render step outputs derived from it, and lines 126 and 245 render `github.repository_owner` and `github.event.repository.name`.
**Changes**: a job-level `env` entry `BRANCH_NAME` set from `github.ref_name`; lines 24, 27 and 273 read `"$BRANCH_NAME"`, and `$GITHUB_OUTPUT` is quoted; the "Script and args" and "Run service script" steps receive `SCRIPT_FILE_NAME` and `ARGS` through step-level `env` and quote them; lines 126 and 245 use `${GITHUB_REPOSITORY}`, the runner variable with the same `owner/name` value.

#### 2. Service webhook workflows

**Files**: `.github/workflows/api.yml`, `host.yml`, `llm.yml`, `mcp.yml`, `telegram.yml`
**Why**: lines 21 and 25 render `inputs.TAG`, the release tag, into the `curl` command.
**Changes**: a job-level `env` entry `IMAGE_TAG` set from `inputs.TAG`; both URLs end in `?tag=${IMAGE_TAG}`.

#### 3. Image build workflow

**File**: `.github/workflows/docker-image.yml`
**Why**: line 93 renders `inputs.TAG` into the image references.
**Changes**: the "Set image tags" step gets `env: IMAGE_TAG` from `inputs.TAG`, and line 93 uses `${IMAGE_TAG}`. The boolean `inputs.PRERELEASE` comparisons at lines 27 and 94 stay.

### Success Criteria:

#### Automated Verification:

- [x] The harness reports no `run:` expression other than secrets and `inputs.PRERELEASE`, and every `run:` script passes `bash -n`.
- [x] The simulation prints identical results for the original and the changed steps with `ansible-up`, `ansible-down`, `ansible-up-preview` and `ansible-down-preview`, and with the tag `v1.2.3`.
- [x] With a branch name that contains `$(touch <file>)`, the original steps create the file and the changed steps do not.

#### Manual Verification:

- [ ] The next release and the next deployment run complete (owner).

---

## Phase 3: Action pins and permissions

### Overview

Replace every third-party tag with the commit it points at, and declare the token permissions each workflow uses.

### Changes Required:

#### 1. Action pins

| File and line                                  | From                          | To                                                                           |
| ---------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `ansible.yml:21`, `docker-image.yml:23`        | `actions/checkout@v5`         | `actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0`         |
| `prepare-docker-images.yml:32`                 | `actions/checkout@v4`         | `actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0`         |
| `docker-image.yml:101`                         | `docker/login-action@v4`      | `docker/login-action@dbcb813823bdd20940b903addbd779551569679f # v4.6.0`      |
| `docker-image.yml:110`, `docker-image.yml:124` | `docker/build-push-action@v7` | `docker/build-push-action@c3c9e263c25d99ce0380d002d59b67737d91b0dc # v7.4.0` |

**Why**: a tag can be moved to other code; a commit cannot.

#### 2. Permissions

**Files**: the ten remaining workflows.
**Why**: none of them writes through the `GITHUB_TOKEN`, so each can declare less than the repository default.
**Changes**: a top-level `permissions: contents: read` after `on:` (before `concurrency:` in `release.yml`), as in the table above.

### Success Criteria:

#### Automated Verification:

- [x] Every workflow parses with `js-yaml`, and the harness reports no violation.
- [x] For each pin, `gh api repos/<owner>/<repo>/git/ref/tags/<exact tag>` and `.../git/ref/tags/<replaced major tag>` resolve to the pinned commit (dereferencing a tag object if one appears).
- [x] `npx prettier --check .github/workflows/*.yml` passes.

#### Manual Verification:

- [ ] The first release after merge shows no permission error at workflow start (owner).

---

## Testing Strategy

### Unit Tests:

- None in the repository (see "What We're NOT Doing"). The scratchpad harness `check-workflows.mjs` checks parsing, top-level permissions, commit pins with version comments, the `run:` expression allow-list, `bash -n` for every script, `workflow_call` input contracts, and a branch filter plus merge guard on every `pull_request: closed` workflow. Run against the original files it must report the 45 known violations, which shows that each check can fail.

### Integration Tests:

- A simulation script extracts the changed `run:` scripts from the original and the new files, renders expressions the way the runner does (text substitution for the original, environment variables for the new), and runs them in a scratch directory with stub `up.sh` and `down.sh`.

### Manual Testing Steps:

1. Publish a prerelease and confirm the release chain completes (owner).
2. Merge a pull request from `main` into `ansible-up-preview` and confirm the `Env` run executes `up.sh` with the preview secrets (owner, at the next preview deployment).
3. Close a pull request into `main` and confirm no `Env` run appears.

## Performance Considerations

Closed pull requests outside `ansible-*` no longer start a skipped `Env` run. Nothing else changes.

## Migration Notes

- The deployment branches carry their own copies of the workflow files. The usual pull request from `main` into an `ansible-*` branch brings the new files in; a manual run from a deployment branch that was not updated uses that branch's older copy.
- Projects built on this framework inherit the files. A project that added steps writing through the `GITHUB_TOKEN` to these workflows needs a job-level `permissions` entry for them; a project whose deployment branch names do not start with `ansible-` needs its own filter; a project with its own actions pins them the same way.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-320.md` (local, not committed)
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-320.md`
- Process: `thoughts/shared/processes/singlepagestartup/ISSUE-320.md`
