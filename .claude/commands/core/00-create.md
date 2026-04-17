---
description: Create new issue with local documentation and GitHub issue
model: opus
---

# Create Issue

You create a new development issue with local documentation and GitHub issue creation.

## Status Gate

**Entry**: None (can be run anytime for new issues)

## Process

1. **Gather information**:

   - Ask user for issue title
   - Ask for problem description
   - Ask for priority (high/medium/low)
   - Ask for size label (xs/small/medium/large)
   - Ask for issue type (feature/bug/refactoring/research)

2. **Create local ticket file**:

   - Run `gh repo view --json name -q '.name'` to get REPO_NAME
   - Determine a TEMP_IDENTIFIER (kebab-case from title, e.g., `auth-login-fix`)
   - Save to `thoughts/shared/tickets/REPO_NAME/ISSUE-{TEMP_IDENTIFIER}.md`
   - Create a matching temporary process file at `thoughts/shared/processes/REPO_NAME/ISSUE-{TEMP_IDENTIFIER}.md`
   - Follow the structure in `.claude/references/process-artifact-contract.md`
   - Format: Use the standard ticket structure below

   ```markdown
   # Issue: [title]

   ## Metadata

   **URL**: (local issue, not in GitHub yet)
   **Status**: Triage
   **Created**: YYYY-MM-DD
   **Priority**: [priority]
   **Size**: [size]

   ---

   ## Problem to Solve

   [Detailed description of the problem]

   ## Key Details

   - [Bullet points of important details]

   ## Implementation Notes

   [Any implementation hints or constraints]
   ```

3. **Create GitHub issue** (ask user to confirm first):

   - Run the GitHub/project sequence inside a single `bash` shell. The repo may default to `zsh`, but this workflow sources `.claude/helpers/load_config.sh` and must keep the exported config in the same shell context:
     ```bash
     bash -lc '
     source .claude/helpers/load_config.sh
     # gh issue/project commands go here
     '
     ```
   - If `gh` fails with `error connecting to api.github.com` in a sandboxed agent, rerun the same `bash -lc` block with network escalation instead of changing the workflow steps.
   - Create issue via `gh issue create --title "..." --body-file ISSUE_BODY_FILE --label "size:[size]"`:
     ```bash
     ISSUE_BODY_FILE="$(mktemp)"
     cat > "$ISSUE_BODY_FILE" <<'EOF'
     [Issue description markdown]
     EOF
     gh issue create --title "..." --body-file "$ISSUE_BODY_FILE" --label "size:[size]"
     rm -f "$ISSUE_BODY_FILE"
     ```
   - Add to GitHub Project via helper (uses `.claude/.env` owner and GraphQL fallback):
     ```bash
     .claude/helpers/add_issue_to_project.sh ISSUE_NUMBER ISSUE_URL
     ```
   - Set initial status to "Triage":
     ```bash
     .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Triage"
     ```
   - Update local ticket file with GitHub URL and issue number
   - Update the process file with:
     - `issue_number`;
     - `current_phase: create`;
     - `Create: completed`;
     - `Research: not_started`;
     - outputs/notes for the created ticket + GitHub issue;
     - any substantive incidents encountered during creation (for example network escalation, helper failure, or project-status mismatch) using the process artifact contract
   - Rename the local ticket file from `ISSUE-{TEMP_IDENTIFIER}.md` to `ISSUE-{ISSUE_NUMBER}.md` (e.g., `ISSUE-145.md`)
   - Rename the process file from `ISSUE-{TEMP_IDENTIFIER}.md` to `ISSUE-{ISSUE_NUMBER}.md`

4. **Update status to "Research Needed"**:

   - Run `.claude/helpers/update_issue_status.sh ISSUE_NUMBER "Research Needed"`
   - This signals the issue is ready for the `research` phase
   - Update the process file `Next step` to indicate `core/10-research`

## Exit

- [ ] Local ticket file created at `thoughts/shared/tickets/REPO_NAME/ISSUE-{ISSUE_NUMBER}.md`
- [ ] Process file created at `thoughts/shared/processes/REPO_NAME/ISSUE-{ISSUE_NUMBER}.md`
- [ ] GitHub issue created (or user declined)
- [ ] Status updated to "Research Needed" in GitHub Project
