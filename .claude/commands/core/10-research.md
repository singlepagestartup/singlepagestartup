---
description: Research codebase for GitHub issue in "Research Needed" status
model: opus
---

# Research Issue

You research the codebase to understand the issue context and document findings. Your only job is to document and explain the codebase as it exists today — do NOT suggest improvements or identify problems unless explicitly asked.

## Status Gate

**Entry**: Issue must be in "Research Needed" or "Research in Progress" status (the latter allows resuming an interrupted session)

```bash
CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)

if [[ "$CURRENT_STATUS" != "Research Needed" && "$CURRENT_STATUS" != "Research in Progress" ]]; then
  echo "❌ Cannot proceed: Issue #$ISSUE_NUMBER has status '$CURRENT_STATUS'"
  echo "This command requires status: 'Research Needed' or 'Research in Progress'"
  echo "Please move the issue to 'Research Needed' in the GitHub Project UI first, or use:"
  echo "  .claude/helpers/update_issue_status.sh ISSUE_NUMBER \"Research Needed\""
  exit 1
fi
```

## Process

1. **Resolve issue and read ticket file**:

   - Run `gh repo view --json name -q '.name'` to get REPO_NAME
   - Check if ticket file exists at `thoughts/shared/tickets/REPO_NAME/ISSUE-{NUMBER}.md`
   - If no ticket file exists, fetch and format issue from GitHub:
     ```bash
     gh issue view ISSUE_NUMBER --json title,body,comments,labels,url,createdAt
     ```
     Save as readable Markdown to `thoughts/shared/tickets/REPO_NAME/ISSUE-{NUMBER}.md` with:
     - Header: `# Issue #XXX: [title]`
     - Metadata: URL, status, created date
     - Sections: Problem to solve, Key details, Implementation notes (if applicable), References, Comments
   - Read the ticket file completely
   - Read any linked documents or file references in the issue description/comments
   - If insufficient information to conduct research, add a comment asking for clarification:
     ```bash
     gh issue comment ISSUE_NUMBER --body "Need clarification before research: [specific question]"
     ```
     Then move back to "Research Needed" and EXIT

2. **Update status to "Research in Progress"**:

   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Research in Progress"
   ```

3. **Analyze and decompose the research question**:

   - Break down the issue into composable research areas
   - Think deeply about underlying patterns, connections, and architectural implications
   - Create a research plan using TodoWrite to track all subtasks
   - Identify specific components, patterns, or concepts to investigate
   - Determine which directories, files, or architectural patterns are relevant

4. **Read any directly mentioned files first**:

   - Read them FULLY (no limit/offset parameters) before spawning sub-tasks
   - This ensures full context before decomposing the research

5. **Spawn parallel sub-agent tasks for comprehensive research**:

   Create multiple Task agents to research different aspects concurrently:

   **For codebase research:**

   - **codebase-locator**: Find WHERE files and components live
   - **codebase-analyzer**: Understand HOW specific code works (without critiquing it)
   - **codebase-pattern-finder**: Find examples of existing patterns (without evaluating them)

   **For thoughts directory:**

   - **thoughts-locator**: Discover what documents exist about the topic
   - **thoughts-analyzer**: Extract key insights from specific relevant documents

   **For web research** (only if user explicitly asks or issue requires it):

   - **web-search-researcher**: External documentation and resources — always return links

   All agents are documentarians, not critics. They describe what exists without suggesting improvements.

6. **Wait for all sub-agents to complete and synthesize findings**:

   - IMPORTANT: Wait for ALL sub-agent tasks to complete before proceeding
   - Compile all sub-agent results (both codebase and thoughts findings)
   - Prioritize live codebase findings as primary source of truth
   - Use thoughts/ findings as supplementary historical context
   - Connect findings across different components
   - Include specific file paths and line numbers for reference
   - Highlight patterns, connections, and architectural decisions
   - Answer the research questions with concrete evidence

7. **Gather metadata and document findings**:

   - Get current git metadata:
     ```bash
     git log -1 --format="%H"   # commit hash
     git branch --show-current  # branch name
     ```
   - Save to `thoughts/shared/research/REPO_NAME/ISSUE-{NUMBER}.md`
   - Use existing research structure with YAML frontmatter:

   ```markdown
   ---
   date: [Current date and time with timezone in ISO format]
   researcher: [username from gh api user -q '.login']
   git_commit: [Current commit hash]
   branch: [Current branch name]
   repository: [REPO_NAME]
   topic: "[Issue title / research topic]"
   tags: [research, codebase, relevant-component-names]
   status: complete
   last_updated: [YYYY-MM-DD]
   last_updated_by: [username]
   ---

   # Research: [Issue Title / Research Topic]

   **Date**: [date]
   **Researcher**: [username]
   **Git Commit**: [hash]
   **Branch**: [branch]
   **Repository**: [REPO_NAME]

   ## Research Question

   [What was researched and why]

   ## Summary

   [High-level findings — describe what exists, answering the research questions]

   ## Detailed Findings

   ### [Component/Area 1]

   - Description of what exists (`file.ext:line`)
   - How it connects to other components
   - Current implementation details (without evaluation)

   ### [Component/Area 2]

   ...

   ## Code References

   - `path/to/file.ts:123` - Description of what's there
   - `another/file.ts:45-67` - Description of the code block

   ## Architecture Documentation

   [Current patterns, conventions, and design implementations found in the codebase]

   ## Historical Context (from thoughts/)

   [Relevant insights from thoughts/ directory with references]

   ## Related Research

   [Links to other research documents in thoughts/shared/research/]

   ## Open Questions

   [Any areas that need further investigation]
   ```

8. **Add GitHub issue comment with research summary**:

   ```bash
   gh issue comment ISSUE_NUMBER --body "Research complete: \`thoughts/shared/research/REPO_NAME/ISSUE-{NUMBER}.md\`

   Key findings:
   - [Major finding 1]
   - [Major finding 2]
   - [Major finding 3]
   ```

9. **Update status to "Research in Review"**:

   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Research in Review"
   ```

## Exit

- [ ] Research documented at `thoughts/shared/research/REPO_NAME/ISSUE-{NUMBER}.md`
- [ ] Issue commented with research summary and document link
- [ ] Status updated to "Research in Review" in GitHub Project

## Completion Message

```
✅ Completed research for #ISSUE_NUMBER: [issue title]

Research topic: [research topic description]

Created at: thoughts/shared/research/REPO_NAME/ISSUE-NUM.md
Attached to the GitHub issue as a comment
Issue moved to "Research in Review" status

Key findings:
- [Major finding 1]
- [Major finding 2]
- [Major finding 3]

View the issue: [ISSUE_URL]
```

## Important Notes

- Always use parallel Task agents to maximize efficiency and minimize context usage
- Always run fresh codebase research — never rely solely on existing research documents
- The thoughts/ directory provides historical context to supplement live findings
- Focus on finding concrete file paths and line numbers for developer reference
- Research documents should be self-contained with all necessary context
- **CRITICAL**: You and all sub-agents are documentarians, not evaluators — document what IS, not what SHOULD BE
- **NO RECOMMENDATIONS**: Only describe the current state of the codebase
- **File reading**: Always read mentioned files FULLY (no limit/offset) before spawning sub-tasks
- Be unbiased — document all related files and how systems work today, don't jump to implementation ideas
