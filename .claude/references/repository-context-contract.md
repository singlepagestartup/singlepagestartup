# Repository and Project Context Contract

SPS workflow commands must resolve the target repository and artifact namespace from the current workspace, not from GitHub CLI defaults.

## Canonical Repository Context

Use `.claude/helpers/load_config.sh` or the dedicated helpers:

```bash
source .claude/helpers/load_config.sh
REPO_NAME="$TARGET_REPO_NAME"
REPO_FULL_NAME="$TARGET_REPO_FULL_NAME"
```

For one-off shell snippets:

```bash
REPO_NAME=$(.claude/helpers/get_repo_name.sh)
REPO_FULL_NAME=$(.claude/helpers/get_repo_full_name.sh)
```

The helper resolves repository context in this order:

1. `TARGET_REPO_FULL_NAME` if intentionally provided.
2. `GITHUB_REPOSITORY` in CI-style environments.
3. `remote.origin.url` from the current git checkout.
4. Ambient `GH_REPO`.
5. `gh repo view` only as a last-resort fallback.

This is required because SPS-based projects often have an `upstream` remote or GitHub CLI default repository that differs from the workspace `origin`.

## Artifact Namespace

All `thoughts/shared/*/REPO_NAME/...` paths must use `TARGET_REPO_NAME` from the helper. Do not derive `REPO_NAME` with bare `gh repo view --json name -q '.name'`.

Never hard-code a project-specific artifact namespace such as `doctorgpt` or `singlepagestartup` in shared workflow instructions.

## GitHub Issue Operations

Use shared helpers when available:

- `.claude/helpers/gh_issue_comment.sh`
- `.claude/helpers/get_issue_status.sh`
- `.claude/helpers/update_issue_status.sh`
- `.claude/helpers/add_issue_to_project.sh`
- `.claude/helpers/create_issue_with_project.sh`

When a raw `gh issue ...` command is unavoidable, pass `--repo "$TARGET_REPO_FULL_NAME"` or run it after sourcing `.claude/helpers/load_config.sh`, which exports `GH_REPO="$TARGET_REPO_FULL_NAME"`.

## GitHub Project Guardrails

Project helpers must select Project items by both:

- issue number; and
- target repository URL.

If a local ticket or process artifact for the issue records a GitHub Project owner/type/number that differs from `.claude/.env`, helpers must fail before reading or updating status. Update `.claude/.env` or the artifact metadata instead of continuing with the mismatched Project.
