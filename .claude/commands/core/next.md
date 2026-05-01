---
description: Determine and run the next workflow phase for a GitHub issue based on its current status
model: sonnet
---

# Next — Smart Workflow Dispatcher

You determine what the next action is for a given issue and run the appropriate phase command automatically. The developer should not need to look at GitHub Project to know what to run next.

## Repository / Project Preflight

Before listing Project items, reading issue status, or resolving progress files, follow `.claude/references/repository-context-contract.md`.

Use:

```bash
source .claude/helpers/load_config.sh
REPO_NAME="$TARGET_REPO_NAME"
REPO_FULL_NAME="$TARGET_REPO_FULL_NAME"
```

Project lists must be filtered to `TARGET_REPO_URL` when selecting issues automatically.

## Process

1. **Resolve issue number**:

   - If an issue number is provided as argument, use it
   - Otherwise, list all issues in active workflow statuses and ask user to pick one:
     ```bash
     source .claude/helpers/load_config.sh
     gh project item-list $GITHUB_PROJECT_NUMBER --owner $GITHUB_PROJECT_CLI_OWNER --format json | \
       jq --arg repo "$TARGET_REPO_URL" '[.items[] | select((.repository // "") == $repo) | select(.status | IN("Research Needed","Research in Progress","Ready for Plan","Plan in Progress","Ready for Dev","In Dev"))]'
     ```

2. **Read GitHub Project status**:

   ```bash
   CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)
   ```

3. **Check local progress file** (if exists):

   ```bash
   REPO_NAME=$(.claude/helpers/get_repo_name.sh)
   PROGRESS_FILE="thoughts/shared/handoffs/$REPO_NAME/ISSUE-${ISSUE_NUMBER}-progress.md"
   ```

   Read the `status` field from YAML frontmatter if file exists.

4. **Print a summary before dispatching**:

   ```
   Issue #NUMBER: [title from gh issue view]
   Current status: [CURRENT_STATUS]
   Action: [what will be run]
   ```

   Then proceed without asking for confirmation (unless status requires human action).

5. **Dispatch based on status**:

   > **Invocation mechanism**: "Run" means read the target command file and execute its instructions directly in the current session. Do NOT use `SlashCommand()` — that spawns a separate agent context which loses issue-number state.

   | GitHub Status        | Progress File        | Action                                                                                               |
   | -------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
   | Research Needed      | —                    | Read and follow `core/10-research.md`                                                                |
   | Research in Progress | —                    | Read and follow `core/10-research.md` (gate accepts this status — resumes in-progress work)          |
   | Research in Review   | —                    | Inform: awaiting human review. Instruct to move to "Ready for Plan" in GitHub Project                |
   | Ready for Plan       | —                    | Read and follow `core/20-plan.md`                                                                    |
   | Plan in Progress     | —                    | Read and follow `core/20-plan.md` (gate accepts this status — resumes or revises plan)               |
   | Plan in Review       | —                    | Inform: awaiting human review. Instruct to move to "Ready for Dev" in GitHub Project                 |
   | Ready for Dev        | —                    | Read and follow `core/30-implement.md`                                                               |
   | In Dev               | exists (in_progress) | Read and follow `core/30-implement.md`; detects progress file and resumes from last incomplete phase |
   | In Dev               | —                    | Read and follow `core/30-implement.md`                                                               |
   | Code Review          | exists               | Inform: PR submitted, awaiting review. Show PR link from progress file                               |
   | Code Review          | —                    | Inform: PR submitted, awaiting code review                                                           |
   | Triage               | —                    | Inform: issue needs human preparation before automation can proceed                                  |
   | Spec Needed          | —                    | Inform: issue needs human specification before automation can proceed                                |
   | Done                 | —                    | Inform: issue is complete                                                                            |

## Human Action Required Messages

When a status requires human action, print a clear message:

**Research in Review**:

```
Issue #NUMBER is in "Research in Review" status.

Action required: Review the research findings and advance the issue to "Ready for Plan" in GitHub Project.

Research document: [path from issue comment if available]

Once the issue is moved to "Ready for Plan", run: /core/next NUMBER (or /core/20-plan NUMBER)
```

**Plan in Review**:

```
Issue #NUMBER is in "Plan in Review" status.

Action required: Review the implementation plan and advance the issue to "Ready for Dev" in GitHub Project.

Plan document: [path from issue comment if available]

Once the issue is moved to "Ready for Dev", run: /core/next NUMBER (or /core/30-implement NUMBER)
```

**Code Review**:

```
Issue #NUMBER is in "Code Review" status.

PR: [PR URL from progress file if available]

Action required: Review and merge the PR, then move the issue to "Done" in GitHub Project.
```

**Triage / Spec Needed**:

```
Issue #NUMBER is in "[STATUS]" status.

Action required: Human preparation needed before automation can proceed.
- Triage: categorize the issue and determine next steps
- Spec Needed: add more detail to the issue description before research can start

Once ready, update the issue status in GitHub Project to "Research Needed".
```

**Done**:

```
Issue #NUMBER is complete (status: Done).

Post-merge cleanup (if not done yet):
  rm thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md
  git add -A && git commit -m "chore: clean up handoff file for #ISSUE_NUMBER (merged)"
```

## Exit

- Correct phase command invoked based on current status
- If human action required: clear instruction printed, no command run
