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

   - Load project config once before all `gh` project operations:
     ```bash
     source .claude/helpers/load_config.sh
     ```
   - Create issue via `gh issue create --title "..." --body "..." --label "size:[size]"`
   - Add to GitHub Project via helper (uses `.claude/.env` owner and GraphQL fallback):
     ```bash
     .claude/helpers/add_issue_to_project.sh ISSUE_NUMBER ISSUE_URL
     ```
   - Set initial status to "Triage":
     ```bash
     .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Triage"
     ```
   - Update local ticket file with GitHub URL and issue number
   - Rename the local ticket file from `ISSUE-{TEMP_IDENTIFIER}.md` to `ISSUE-{ISSUE_NUMBER}.md` (e.g., `ISSUE-145.md`)

4. **Update status to "Research Needed"**:

   - Run `.claude/helpers/update_issue_status.sh ISSUE_NUMBER "Research Needed"`
   - This signals the issue is ready for the `research` phase

## Exit

- [ ] Local ticket file created at `thoughts/shared/tickets/REPO_NAME/ISSUE-{ISSUE_NUMBER}.md`
- [ ] GitHub issue created (or user declined)
- [ ] Status updated to "Research Needed" in GitHub Project
