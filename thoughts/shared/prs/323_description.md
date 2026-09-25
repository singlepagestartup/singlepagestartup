Closes #320.

## Summary

The workflows referenced every third-party action by a major tag, substituted branch names and release tags into shell script text, and ran with the repository's default token permissions. Two pull-request workflows listened for branches that no longer exist.

This change pins each action to the commit its tag points at, passes branch names, step outputs and release tags to scripts through quoted environment variables, declares `permissions: contents: read` in every workflow, removes `deploy-to-icp.yml` and `update-host.yml`, and limits `deployer.yml` to pull requests into `ansible-*` branches.

`deployer.yml` stays. The ref of a merged pull request is its base branch, and merging a pull request from `main` into `ansible-up`, `ansible-down` or their `-preview` variants is how a deployment starts: 36 such pull requests were merged between 2023-11 and 2025-11, and #130 started run 19761939787. Without a branch filter the workflow also started a skipped run for every other closed pull request.

## Changes

The pins keep the code that runs today, except in `prepare-docker-images.yml`, whose checkout moves from `v4` to the `v5.1.0` commit the other workflows use.

| Reference                     | Where                                | Pinned to                                           |
| ----------------------------- | ------------------------------------ | --------------------------------------------------- |
| `actions/checkout@v5`         | `ansible.yml`, `docker-image.yml`    | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0` |
| `actions/checkout@v4`         | `prepare-docker-images.yml`          | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0` |
| `docker/login-action@v4`      | `docker-image.yml`                   | `dbcb813823bdd20940b903addbd779551569679f # v4.6.0` |
| `docker/build-push-action@v7` | `docker-image.yml`, both build steps | `c3c9e263c25d99ce0380d002d59b67737d91b0dc # v7.4.0` |

- `ansible.yml`: the job variable `BRANCH_NAME` takes the `BRANCH` input that `deployer.yml` passes and falls back to the branch a manual run starts from. The script name, the arguments and the `-preview` choice of secrets all read it. Step outputs reach the scripts as step `env:` values and the repository as the runner's `GITHUB_REPOSITORY`; every use is quoted.
- `api.yml`, `host.yml`, `llm.yml`, `mcp.yml`, `telegram.yml` and the "Set image tags" step of `docker-image.yml`: the release tag reaches the script as `IMAGE_TAG`, the pattern `prepare-docker-images.yml` already used.
- All ten workflows declare `permissions: contents: read`. None writes through the `GITHUB_TOKEN`; only `actions/checkout` uses it, and the five service workflows use no token at all.
- `deployer.yml`: `branches: ["ansible-*"]` under `pull_request`, and the job condition is the merge guard alone, since the filter already limits the branch. `secrets: inherit` and the `BRANCH` input are unchanged.
- Deleted `deploy-to-icp.yml` (branch `deploy-to-icp` absent, no merge guard, builds `backend/` and `frontend/`, which are gone) and `update-host.yml` (branch `update-frontend` absent, no merge guard). The three workflows `update-host.yml` called stay in use by `release.yml`.
- `tools/deployer/README.md`: a paragraph in "GitHub Actions deployment" on how a deployment run starts.
- `thoughts/shared/`: research, plan, process log and implementation progress for #320.

## Verification

- [x] All ten workflows parse with `js-yaml`. A one-off harness also checks top-level permissions, commit pins with version comments, an allow-list of expressions inside `run:` (secrets and the boolean `inputs.PRERELEASE`), `bash -n` on every script, `workflow_call` input contracts, and a branch filter plus merge guard on every `pull_request: closed` workflow. It reports no violation on the new files and 45 on the original twelve.
- [x] An old-versus-new simulation of every changed step with placeholder secrets: 29 identical comparisons covering the four deployment branch names both when `deployer.yml` calls `ansible.yml` and on a manual run, the tag `v1.2.3` for a prerelease and a release, a manual dispatch of a service workflow without inputs, and the image tag list. A caller that passes `BRANCH=ansible-down-preview` gets `down.sh` with the preview secrets. A branch name or tag carrying `$(touch …)` ran the command with the original files and passes through as text with the new ones.
- [x] Each pinned commit is the commit behind both the exact release tag in its comment and that release's major tag (`gh api repos/<owner>/<repo>/git/ref/tags/<tag>`; all are lightweight tags) and exists in the action's repository. Those major tags are the ones the lines used before, except `@v4` in `prepare-docker-images.yml`.
- [x] Mutation check: restoring one guard of each kind (the `github.ref_name` expression, the branch filter, a tag reference, a permissions block) produced exactly those four harness violations and a failing simulation. Reading `BRANCH_NAME` from `github.ref_name` again, or reading the `-preview` conditions from it, gives the caller above the wrong script or the default secrets and fails the simulation. Restoring the files returned the tree to the committed state.
- [x] `npx prettier --check` on the changed YAML and Markdown files; `node tools/agents/code-placement.mjs`.
- [x] Checks on this pull request: CodeQL (`actions`, `javascript-typescript`, `python`) and Socket Security pass. Code scanning lists 20 open `actions/missing-workflow-permissions` alerts in `.github/workflows` on `main` and none on this pull request's merge ref.

`actionlint`, `shellcheck` and `yamllint` were not available on the machine that ran the checks. No Nx project owns the changed paths, so no jest, eslint or tsc lane applies.

## How to verify it

1. Publish a prerelease and confirm the release chain (image build, image pull, five service webhooks) finishes without a permission error.
2. At the next preview deployment, merge a pull request from `main` into `ansible-up-preview` and confirm the `Env` run executes `up.sh` with the preview secrets.
3. Close a pull request into `main` and confirm no `Env` run appears.

## Notes

- Deployment branches carry their own copies of the workflow files. The next deployment pull request from `main` brings the new files; a manual `Ansible` run from a deployment branch that has not received them uses its older copy.
- Secrets are still substituted into `run:` in `ansible.yml`, `docker-image.yml` and `prepare-docker-images.yml`; the repository owner sets their values.
- `tools/deployer/github_releaser.sh` still creates `update-host` branches, which no workflow listens to.
- Repository and organization settings are not part of this change.

## Downstream migration

Adaptation is required in projects that keep the framework's `.github/workflows`. The workflows now run with a read-only `GITHUB_TOKEN`, pin third-party actions to commits, pass branch names and release tags to scripts through environment variables, no longer include the `deploy-to-icp` and `update-host` pull-request workflows, and start the deployment workflow only for pull requests into `ansible-*` branches. `ansible.yml` takes the deployment branch from its `BRANCH` input when another workflow calls it.

**Applies to:** projects with their own steps in these workflows that write through the `GITHUB_TOKEN`, deployment branches whose names do not start with `ansible-`, a remaining use of `deploy-to-icp.yml` or `update-host.yml`, their own `ansible.yml` steps that render `github.ref_name` or `inputs.TAG` into `run:` scripts, their own workflows that call `ansible.yml`, or self-hosted runners for `prepare-docker-images.yml`.

**Actions:**

- Resolve conflicts in `.github/workflows` by keeping the commit-pinned `uses:` lines with their version comments and the top-level `permissions: contents: read`, and pin any project-owned third-party action the same way, to the commit its tag points at.
- Pass the deployment branch name, in the `ansible-<script>[-preview]` form, as `BRANCH` from any project-owned workflow that calls `ansible.yml`: the input now picks the script and the secret set, and a manual run still uses the branch it starts from.
- Keep the `ansible-*` filter in `deployer.yml`, or restore a branch-name check in its job condition, before removing either: the job now calls `ansible.yml` for every merged pull request the trigger admits.
- Run `prepare-docker-images.yml` on a runner that supports `actions/checkout` v5 (runner 2.327.1 or later), as `ansible.yml` and `docker-image.yml` already require.
- Give any project-owned job in these workflows that creates releases, writes comments, pushes commits or tags, or publishes packages through the `GITHUB_TOKEN` its own job-level `permissions` entry; the workflow-level token is now read-only.
- Add project deployment branch names that do not begin with `ansible-` to the `branches` filter of `.github/workflows/deployer.yml`. A project that still merges into `deploy-to-icp` or `update-frontend` restores that workflow as a project-owned file with a `github.event.pull_request.merged == true` guard.
- In project-owned `run:` steps of these workflows, read the branch as `"$BRANCH_NAME"` in `ansible.yml` and pass inputs and step outputs through `env:` instead of rendering `${{ github.ref_name }}`, `${{ inputs.TAG }}` or `${{ steps.*.outputs.* }}` into the script.

**Verify:** publish a prerelease and confirm the release chain finishes without a permission error; merge a pull request from `main` into a preview deployment branch and confirm the `Env` run executes `up.sh` with the preview secrets; start the `Ansible` workflow by hand from the same branch and confirm the same selection; close a pull request into `main` and confirm no `Env` run appears.
