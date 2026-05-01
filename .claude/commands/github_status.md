---
description: Check GitHub issue status in Project (single source of truth)
---

# GitHub Issue Status Checker

You check the status of a GitHub issue in the GitHub Project.

**IMPORTANT:** This is the single source of truth for checking issue status. Use this skill whenever you need to know if an issue is in a specific status.

## Input

Issue number (e.g., `142`)

## Process

1. **Load repository/project context**:

```bash
source .claude/helpers/load_config.sh
```

2. **Read status through the shared helper**:

```bash
.claude/helpers/get_issue_status.sh ISSUE_NUMBER
```

The helper resolves the target repository from `.claude/references/repository-context-contract.md`, filters Project items by both issue number and repository URL, and fails if existing local artifacts point at a different Project.

## Output

Return the status name:

- `Research Needed`
- `Research in Progress`
- `Research in Review`
- `Ready for Plan`
- `Plan in Progress`
- `Plan in Review`
- `Ready for Dev`
- `In Dev`
- `Code Review`
- `Done`
- `Triage`
- `Spec Needed`

## Usage in other commands

When a command needs to check status:

```
/skill github_status 142
```

Then check the returned status against your required status.
