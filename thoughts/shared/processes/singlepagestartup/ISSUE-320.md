---
issue_number: 320
issue_title: "Add workflow permissions, pin actions and remove unused pull-request workflows"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T21:40:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-320 - Add workflow permissions, pin actions and remove unused pull-request workflows

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: second review of pull request #323 after the review fixes

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings N-08. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: all 12 workflows and every ticket claim checked against `78d7d43125`, the GitHub REST API (read-only) and the Actions reference in `github/docs`. Seven third-party `uses:` lines in four files resolve to lightweight tags on `v5.1.0`, `v4.4.0`, `v4.6.0` and `v7.4.0`. `deploy-to-icp.yml` and `update-host.yml` serve branches that do not exist and have no recorded run. `deployer.yml` is the live deployment trigger: a merged pull request into an `ansible-*` branch sets `github.ref_name` to that branch, and run 19761939787 (pull request #130) started its job. No workflow writes through the `GITHUB_TOKEN`.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-320.md`.
- Notes: `actionlint`, `shellcheck` and `yamllint` are not installed; verification uses `js-yaml`, `bash -n` and a one-off harness in the session scratchpad.

### Plan

- Summary: three phases: delete `deploy-to-icp.yml` and `update-host.yml`, limit `deployer.yml` to `ansible-*` base branches and document the trigger; pass branch names, step outputs and release tags to scripts through `env:`; pin the seven third-party references and declare `permissions: contents: read` in the ten remaining workflows. Plan approval is delegated to the issue agent.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-320.md`.
- Notes: the ticket scope asked to delete all three `pull_request: closed` workflows; the plan keeps `deployer.yml` because it is the live deployment trigger (Incident 1). `inputs.TAG` joins the `github.*` expressions moved out of `run:`, following the existing `env: IMAGE_TAG` pattern in `prepare-docker-images.yml`.

### Implement

- Summary: `deploy-to-icp.yml` and `update-host.yml` deleted; `deployer.yml` limited to `ansible-*` base branches; `ansible.yml` reads the branch through `BRANCH_NAME`, the step outputs through `env:` and the repository through the runner variable; the five service workflows and `docker-image.yml` read the release tag through `IMAGE_TAG`; six `uses:` lines pinned to commits with version comments; `permissions: contents: read` in the ten remaining workflows; the deployer README says how a deployment run starts.
- Outputs: commit `34b6d14fb1`; pull request #323 (`thoughts/shared/prs/323_description.md`); `thoughts/shared/handoffs/singlepagestartup/ISSUE-320-progress.md`.
- Notes: no Nx project owns the changed paths, so verification is a scratchpad harness (parse, permissions, pins, `run:` expression allow-list, `bash -n`, `workflow_call` contracts, pull-request guards), an old-versus-new simulation of the changed steps with placeholder secrets, `gh api` checks of every pinned commit, `prettier --check` and the code-placement check. The mutation check restored one guard of each kind and saw the harness and the simulation fail.
- Review round 1: the review of #323 asked for four changes, all applied. `ansible.yml` reads the branch from its `BRANCH` input with a `github.ref_name` fallback and bases the `-preview` secret choice on the same variable; `deployer.yml` keeps only the merge guard behind its `ansible-*` filter; `prepare-docker-images.yml` uses the `v5.1.0` checkout commit. Simulation, harness and pin checks pass again; the details are in the progress file.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 1 -->

### Incident 1 — The deployment trigger was taken for a dead workflow

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: the ticket and the review list `deployer.yml` among the dead `pull_request: closed` workflows because its `contains(github.ref_name, 'ansible')` condition was read as never true for pull request events, and the ticket scope asks to delete it.
- **Root Cause**: for a pull request closed by a merge, `GITHUB_REF` is the branch it was merged into, not `refs/pull/<number>/merge`. Merging a pull request into `ansible-up` therefore satisfies the condition, and that is how deployments start (36 merged pull requests into `ansible-*` branches; run 19761939787 for pull request #130).
- **Fix**: keep `deployer.yml`, restrict its trigger to `ansible-*` base branches and document the trigger in `tools/deployer/README.md`; delete only the two workflows whose branches do not exist.
- **Preventive Action**: before deleting a workflow, list its runs (`gh api repos/<owner>/<repo>/actions/workflows/<id>/runs`) and the pull requests into its trigger branches, and read the `GITHUB_REF` notes for the event in the Actions reference.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-320.md` ("The `pull_request: closed` workflows").

## Reusable Learnings

- A `pull_request` workflow with `types: [closed]` sees the base branch in `github.ref` and `github.ref_name` once the pull request is merged; only a pull request closed without a merge carries `refs/pull/<number>/merge`.
- Before removing a workflow, `gh api repos/<owner>/<repo>/actions/workflows/<id>/runs` and `gh api "repos/<owner>/<repo>/pulls?state=all&base=<branch>"` show whether anything still starts it.
- A run that calls a reusable workflow is recorded under the caller, so a called workflow with zero runs of its own can still be in use.
- A reusable workflow that declares an input should read it, with a fallback for `workflow_dispatch` (`inputs.X || github.ref_name`), and every condition that depends on the same value should read one job variable rather than a second context.
