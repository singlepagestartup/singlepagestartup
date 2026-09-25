---
date: 2026-09-26T00:05:00+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-320-workflow-hardening
repository: singlepagestartup
topic: "Add workflow permissions, pin actions and remove unused pull-request workflows"
tags: [research, codebase, github-actions, workflows, deployer, ansible, release]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Add workflow permissions, pin actions and remove unused pull-request workflows

**Date**: 2026-09-26T00:05:00+03:00
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-320-workflow-hardening
**Repository**: singlepagestartup

## Research Question

Issue #320 concerns the workflows in `.github/workflows/`: how they reference third-party actions, which of the three `pull_request: closed` workflows still serve a branch, where a `${{ }}` expression is rendered into a shell script, and what each workflow does with the `GITHUB_TOKEN`. Every claim in the ticket was checked against the files at `78d7d43125`, against the GitHub REST API through read-only `gh api` calls (tags, branches, pull requests, workflow runs), and against the GitHub Actions reference in the `github/docs` repository.

## Summary

- The directory holds 12 workflows and none declares `permissions:`. Seven `uses:` lines in four files reference a third-party action by its major tag: `actions/checkout@v5` three times, `actions/checkout@v4` once, `docker/login-action@v4` once and `docker/build-push-action@v7` twice. Every other `uses:` calls a local reusable workflow.
- Each of the four tags is a lightweight tag on a commit that also carries an exact release tag: `actions/checkout@v5` is `v5.1.0` (`fbc6f39`), `actions/checkout@v4` is `v4.4.0` (`11d5960`), `docker/login-action@v4` is `v4.6.0` (`dbcb813`) and `docker/build-push-action@v7` is `v7.4.0` (`c3c9e26`).
- `deploy-to-icp.yml` and `update-host.yml` start on pull requests closed into `deploy-to-icp` and `update-frontend`. Neither branch exists on the remote, neither workflow checks `merged`, and the Actions API lists no run for either. `deploy-to-icp.yml` also runs paths that are absent from the repository (`backend/`, `frontend/`, `wait-for-seeed.sh`).
- `deployer.yml` is the live deployment trigger. For a pull request closed by a merge, `GITHUB_REF` is the branch it was merged into, so `github.ref_name` is `ansible-up` when a pull request into `ansible-up` merges, and the `contains(github.ref_name, 'ansible')` condition holds. Pull request #130 (`main` into `ansible-up`, merged 2025-11-28) started run 19761939787, whose `server / ansible run script` job called `ansible.yml` from `refs/heads/ansible-up`. Thirty-six pull requests were merged into `ansible-up`, `ansible-down`, `ansible-up-preview` and `ansible-down-preview` between 2023-11-13 and 2025-11-28. The workflow has no branch filter, so every other closed pull request in the repository starts it too: 85 of the 86 runs the API lists ended as skipped.
- `ansible.yml` renders `github.ref_name` into shell without quotes at lines 24, 27 and 273, renders step outputs derived from it at lines 30-31 and 276, and renders `github.repository_owner` and `github.event.repository.name` at lines 126 and 245. The release tag reaches shell as `inputs.TAG` in `api.yml`, `host.yml`, `llm.yml`, `mcp.yml` and `telegram.yml` (lines 21 and 25) and in `docker-image.yml:93`. `prepare-docker-images.yml:70-73` already passes the same input through `env: IMAGE_TAG`.
- No workflow writes to the repository through the `GITHUB_TOKEN`. Only `actions/checkout` uses it, to read. Docker Hub, Portainer and SSH credentials come from repository secrets, and the `GITHUB_TOKEN` line that `ansible.yml` writes into the deployer `.env` carries the `GH_TOKEN` secret. `release.yml` creates no release and writes no comment: a published release starts it, and it only calls reusable workflows.

## Detailed Findings

### Workflow inventory

| Workflow                                                    | `name:`                              | Triggers                                                               | What the jobs do                                                                                                                             | Expressions rendered into `run:`                                                                        |
| ----------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `release.yml`                                               | Create frontend and backend release  | `release`: `released`, `prereleased`                                   | calls `docker-image`, `prepare-docker-images`, `api`, `llm`, `host`, `mcp` and `telegram` with `secrets: inherit`                            | none                                                                                                    |
| `docker-image.yml`                                          | Build Docker image                   | `workflow_dispatch`; `workflow_call` with `TAG`, `PRERELEASE`          | checkout, secrets into `$GITHUB_ENV`, image tag list, Docker Hub login, build and push                                                       | secrets, `inputs.PRERELEASE`, `inputs.TAG` (`:93`)                                                      |
| `prepare-docker-images.yml`                                 | Prepare Docker images                | `workflow_dispatch` and `workflow_call`, both with `TAG`, `PRERELEASE` | checkout, secrets into `$GITHUB_ENV`, `tools/deployer/docker/pull_image_via_portainer.sh`                                                    | secrets; the tag travels as `env: IMAGE_TAG` (`:70-73`)                                                 |
| `api.yml`, `host.yml`, `llm.yml`, `mcp.yml`, `telegram.yml` | Update api, host, llm, mcp, telegram | `workflow_dispatch`; `workflow_call` with `TAG`, `PRERELEASE`          | one `curl` POST to a Portainer webhook URL held in a secret                                                                                  | secrets, `inputs.TAG` (`:21`, `:25`)                                                                    |
| `ansible.yml`                                               | Ansible                              | `workflow_dispatch`; `workflow_call` with `BRANCH`                     | checkout, script name and arguments from the branch name, deployer `.env` from secrets, run `<script>.sh` in `tools/deployer`                | secrets, `github.ref_name`, two step outputs, `github.repository_owner`, `github.event.repository.name` |
| `deployer.yml`                                              | Env                                  | `pull_request`: `closed`                                               | `server` calls `ansible.yml` with `secrets: inherit` when `contains(github.ref_name, 'ansible') && github.event.pull_request.merged == true` | none                                                                                                    |
| `deploy-to-icp.yml`                                         | Deploy project to internetcomputer   | `pull_request`: `closed` into `deploy-to-icp`                          | builds `backend/` and `frontend/`, installs the ICP SDK by piping a remote script into `sh`                                                  | none                                                                                                    |
| `update-host.yml`                                           | Update frontend                      | `pull_request`: `closed` into `update-frontend`                        | calls `docker-image`, `prepare-docker-images` and `host` with `TAG: ${{ github.sha }}`                                                       | none                                                                                                    |

No file under `.github/` other than `ISSUE_TEMPLATE/` exists, and no composite action lives elsewhere in the repository (`git grep` for `uses:` outside `.github/workflows` finds none).

### Third-party action references

| Reference                     | Lines                                                           | Tag object type | Commit                                     | Exact release tag on the commit |
| ----------------------------- | --------------------------------------------------------------- | --------------- | ------------------------------------------ | ------------------------------- |
| `actions/checkout@v5`         | `ansible.yml:21`, `deploy-to-icp.yml:18`, `docker-image.yml:23` | commit          | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` | `v5.1.0`                        |
| `actions/checkout@v4`         | `prepare-docker-images.yml:32`                                  | commit          | `11d5960a326750d5838078e36cf38b85af677262` | `v4.4.0`                        |
| `docker/login-action@v4`      | `docker-image.yml:101`                                          | commit          | `dbcb813823bdd20940b903addbd779551569679f` | `v4.6.0`                        |
| `docker/build-push-action@v7` | `docker-image.yml:110`, `docker-image.yml:124`                  | commit          | `c3c9e263c25d99ce0380d002d59b67737d91b0dc` | `v7.4.0`                        |

`gh api repos/<owner>/<repo>/git/ref/tags/<tag>` returned an object of type `commit` for all four tags, so none is an annotated tag that needs dereferencing. `gh api repos/<owner>/<repo>/git/matching-refs/tags/<tag>` listed the exact release tag that points at the same commit.

### The `pull_request: closed` workflows

`deploy-to-icp.yml:6-9` starts on pull requests closed into `deploy-to-icp`. `gh api repos/singlepagestartup/singlepagestartup/branches/deploy-to-icp` answers 404, no pull request was ever opened into that branch, and the Actions API lists zero runs for the workflow (id 70460922). The job has no `if:`. Its steps `cd backend`, run `./wait-for-seeed.sh` and call `./frontend/icp-*.sh` (`:26-50`); none of those paths exists at the repository root. The ICP helper scripts live in `tools/deployer/icp/`, and no workflow calls them.

`update-host.yml:3-7` starts on pull requests closed into `update-frontend`. That branch answers 404. Five pull requests were merged into it between 2023-11-02 and 2024-02-09, and the Actions API lists zero runs for the workflow (id 114441218). None of its three jobs has an `if:`. `tools/deployer/github_releaser.sh:28-37` creates `update-host` and `update-host-<environment>`, which exist on the remote with no pull request ever opened into them; no workflow listens to either name.

`deployer.yml:2-12` starts on every closed pull request and calls `ansible.yml` when `contains(github.ref_name, 'ansible') && github.event.pull_request.merged == true`. The GitHub Actions reference (`content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md`, `pull_request` notes) states that `GITHUB_REF` for a closed pull request is `refs/pull/<number>/merge` when it was closed without a merge and the fully qualified ref of the branch it was merged into when it was merged. The run history agrees:

- Run 19761939787 started 2025-11-28T11:04:00Z, three seconds after pull request #130 (`main` into `ansible-up`, title "deploy") merged. Its `referenced_workflows` entry is `ansible.yml@de8ca6e9a1` on `refs/heads/ansible-up`, and its job `server / ansible run script` started at 11:04:03 and ended as `cancelled` at 12:04:20, which is consistent with the job's `timeout-minutes: 60` (`ansible.yml:13`).
- Every other run whose head branch is `main` belongs to a pull request merged into `develop`, `issue-162`, `issue-160` or a `codex/*` branch, and all of them ended as `skipped`.
- The API lists 86 runs (oldest 2025-10-23): 85 `skipped` and the one above.
- Merged pull requests by base branch: `ansible-up` 21, `ansible-down` 9, `ansible-up-preview` 5, `ansible-down-preview` 1, from 2023-11-13 to 2025-11-28. Their titles are "deploy", "undeploy", "deploy preview" and similar.

### How a deployment reaches `ansible.yml`

- `tools/deployer/github_deployer.sh:245-256` names the branches `ansible-up` and `ansible-down`, or `ansible-up-<environment>` and `ansible-down-<environment>` when an environment type is given, and `:268-275` creates them from the current head of `main` through `tools/deployer/github/github-node-api/create_branch.js:12-26`. The same script stores every deployer value as a repository secret, prefixed with `<ENVIRONMENT>_` for a named environment (`:258-290`).
- Merging a pull request into one of those branches starts `deployer.yml`, which calls `ansible.yml` with `secrets: inherit` and `BRANCH: ${{ github.ref_name }}`. `ansible.yml` declares the `BRANCH` input (`:5-9`) and reads `github.ref_name` directly instead; inside a called workflow the `github` context is the caller's, so both hold the same value.
- `ansible.yml:22-27` takes the script name from the second `-`-separated field of the branch name (`up`, `down`) and the arguments from the remaining fields. `:33` and `:152` choose the `PREVIEW_` secrets or the default ones with `contains(github.ref_name, '-preview')`. `:270-276` make `./<script>.sh` executable and run it in `tools/deployer`. The arguments are printed (`:31`) and not passed to the script; `up.sh` and `down.sh` read their values from the `.env` that the workflow writes (`tools/deployer/get_env.sh:3-25` reads only that file).
- `workflow_dispatch` also runs `ansible.yml`, taking the branch it was started from. Started from `main`, `cut -d'-' -f2` returns `main` and `chmod +x ./main.sh` fails.
- Each deployment branch holds its own copy of `.github/workflows/`. `ansible-up` is at the #130 merge commit `de8ca6e9a1` (705 commits behind `main`); `ansible-down`, `ansible-up-preview` and `ansible-down-preview` date from 2024-09-05. A pull request from `main` brings the workflow files of `main` into the merge commit that the run executes.

### Expressions rendered into shell

`ansible.yml` renders these values into script text before the shell runs:

- `:24` `echo "SCRIPT_FILE_NAME=$(echo ${{ github.ref_name }} | cut -d'-' -f2)" >> $GITHUB_OUTPUT`
- `:27` `echo "ARGS=$(echo ${{ github.ref_name }} | cut -d'-' -f3- | tr '-' ' ')" >> $GITHUB_OUTPUT`
- `:30-31` `echo SCRIPT: ${{ steps.set-script-file-name.outputs.SCRIPT_FILE_NAME }}.sh` and `echo ARGS: ${{ steps.set-script-args.outputs.ARGS }}`
- `:272-273` `chmod +x ./$(echo ${{ github.ref_name }} | cut -d'-' -f2).sh`
- `:276` `./$(echo ${{ steps.set-script-file-name.outputs.SCRIPT_FILE_NAME }}).sh`
- `:126` and `:245` `"GITHUB_REPOSITORY ${{ github.repository_owner }}/${{ github.event.repository.name }}"`, the same value as the runner variable `GITHUB_REPOSITORY`.

The five service workflows render `inputs.TAG` into the webhook URL at lines 21 and 25, and `docker-image.yml:93` renders it into the image reference. The tag comes from `github.event.release.tag_name` (`release.yml:18-76`); a manual dispatch of the five service workflows or of `docker-image.yml` has no inputs, so the value is empty there. `prepare-docker-images.yml:70-73` passes the same input through `env: IMAGE_TAG`, and its script reads `$IMAGE_TAG`.

For these runs `github.ref_name` is a branch of this repository: the branch a merged pull request targeted, or the branch a run was dispatched from. A release tag is created by whoever publishes the release. Git ref names may contain `$`, `(`, `)`, `;`, backquotes and quotes, and the shell interprets them when the value is part of the script text. The other expressions rendered into `run:` are secrets and the boolean `inputs.PRERELEASE`, which renders as `true` or `false`.

### Token use per workflow

| Workflow                                                    | Uses the `GITHUB_TOKEN`                                                     | Writes to the repository              |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| `release.yml`                                               | no step of its own; the called workflows below                              | no                                    |
| `docker-image.yml`                                          | `actions/checkout` reads the repository; the build context is the path `./` | no; pushes to Docker Hub with secrets |
| `prepare-docker-images.yml`                                 | `actions/checkout` reads the repository                                     | no; calls Portainer with secrets      |
| `api.yml`, `host.yml`, `llm.yml`, `mcp.yml`, `telegram.yml` | not at all                                                                  | no; calls a Portainer webhook         |
| `ansible.yml`                                               | `actions/checkout` reads the repository                                     | no; connects over SSH with secrets    |
| `deployer.yml`                                              | no step of its own; calls `ansible.yml`                                     | no                                    |

The GitHub reusable-workflow reference (`content/actions/reference/workflows-and-actions/reusing-workflow-configurations.md`) states that a called workflow can only narrow the `GITHUB_TOKEN` permissions it receives from its caller, and that in a chain of nested workflows each level has the same or fewer permissions.

### Tooling available for verification

`actionlint`, `shellcheck` and `yamllint` are not installed, and Python has no `yaml` module. `js-yaml` is available through `node_modules`, and `prettier` 3.5.3 reports every workflow file and `tools/deployer/README.md` as formatted. The repository has no lint target or test lane for `.github/`, and `lint-staged.config.js:2` runs `prettier --write` only on js, jsx, ts, tsx, md, css and scss files.

## Claims in the ticket, checked

| Claim                                                                                            | Result                                                    | Evidence                                                                                             |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| No workflow declares `permissions:`                                                              | holds                                                     | `grep -n permissions .github/workflows/*.yml` finds nothing                                          |
| Every action is referenced by tag                                                                | holds for all seven third-party references                | table above                                                                                          |
| `deploy-to-icp.yml` and `update-host.yml` have no `merged` guard and their branches do not exist | holds                                                     | both files; branches API answers 404                                                                 |
| The `deployer.yml` condition is never true for pull request events                               | does not hold for merged pull requests                    | GitHub reference on `GITHUB_REF`; run 19761939787; 36 merged pull requests into `ansible-*` branches |
| `ansible.yml` renders `github.ref_name` into shell without quotes at 24, 27 and 272-276          | holds; lines 30-31, 126 and 245 carry related expressions | file                                                                                                 |

## Code References

- `.github/workflows/ansible.yml:3-9` - `workflow_dispatch` and `workflow_call` with the unused `BRANCH` input
- `.github/workflows/ansible.yml:21` - `actions/checkout@v5`
- `.github/workflows/ansible.yml:22-31` - script name and arguments derived from `github.ref_name`
- `.github/workflows/ansible.yml:33`, `:152` - preview or default secret set chosen by the branch name
- `.github/workflows/ansible.yml:126`, `:245` - `GITHUB_REPOSITORY` built from `github.*` expressions
- `.github/workflows/ansible.yml:270-276` - `chmod` and run of `./<script>.sh`
- `.github/workflows/deployer.yml:1-12` - the `Env` workflow that calls `ansible.yml`
- `.github/workflows/deploy-to-icp.yml:1-50` - ICP deployment on pull requests into `deploy-to-icp`
- `.github/workflows/update-host.yml:1-33` - host rebuild on pull requests into `update-frontend`
- `.github/workflows/release.yml:1-77` - release fan-out to the reusable workflows
- `.github/workflows/docker-image.yml:23`, `:93`, `:101`, `:110`, `:124` - checkout, tag rendering, Docker Hub login, build and push
- `.github/workflows/prepare-docker-images.yml:32`, `:70-73` - checkout and the `env: IMAGE_TAG` pattern
- `.github/workflows/{api,host,llm,mcp,telegram}.yml:21`, `:25` - webhook calls with `inputs.TAG`
- `tools/deployer/github_deployer.sh:245-275` - deployment branch names and creation
- `tools/deployer/github_releaser.sh:28-56` - `update-host` branch names and creation
- `tools/deployer/github/github-node-api/create_branch.js:12-26` - branches start at the head of `main`
- `tools/deployer/get_env.sh:3-25` - deployer values come only from the `.env` file
- `tools/deployer/README.md:317-340` - "GitHub Actions deployment": secrets for the SSH key, no description of how a run starts

## Architecture Documentation

- Release pipeline: publishing a release or prerelease starts `release.yml`, which builds and pushes one image (`docker-image.yml`), pulls it on the server through Portainer (`prepare-docker-images.yml`), then calls the Portainer webhook of each service. `concurrency` separates preview and production runs (`release.yml:9-11`, `prepare-docker-images.yml:27-29`).
- Deployment pipeline: the branch name is the command. Merging a pull request into `ansible-<script>[-<environment>]` runs `<script>.sh` from `tools/deployer` with the matching secret set.
- Reusable workflows receive secrets through `secrets: inherit` and values through typed `workflow_call` inputs.
- One workflow already keeps an input out of the script text: `prepare-docker-images.yml` maps `inputs.TAG` to `env: IMAGE_TAG`.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-215.md` and `thoughts/shared/plans/singlepagestartup/ISSUE-215.md` describe how `ansible.yml` carries the Redis password from secrets into the deployer `.env`, and treat that workflow as the GitHub Actions deployment path.
- `thoughts/shared/research/singlepagestartup/ISSUE-222.md` lists `release.yml` and `ansible.yml` as the release and deployment paths.
- `thoughts/shared/processes/singlepagestartup/ISSUE-199.md` records `ansible.yml` among the files changed for the MCP service settings.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-215.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-222.md`
- Finding N-08 of the 2026-09-25 security review, a local document that is not committed.

## Open Questions

None block the plan. `tools/deployer/github_releaser.sh` creates `update-host` branches that no workflow listens to; that script is outside this issue.
