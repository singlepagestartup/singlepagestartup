---
description: Create git commits with user approval and no Claude attribution
---

# Commit Changes

You are tasked with creating git commits for the changes made during this session.

## Process:

1. **Think about what changed:**

   - Review the conversation history and understand what was accomplished
   - Run `git status` to see current changes
   - Run `git diff` to understand tracked modifications
   - For untracked files, inspect content with `git diff --no-index /dev/null <path>` (or stage and use `git diff --cached -- <path>`)
   - Quote paths that contain shell glob characters (`[]`, `*`, `?`) when running commands
   - Consider whether changes should be one commit or multiple logical commits

2. **Plan your commit(s):**

   - Identify which files belong together
   - Draft clear, descriptive commit messages
   - Use imperative mood in commit messages
   - Focus on why the changes were made, not just what

3. **Present your plan to the user:**

   - List the files you plan to add for each commit
   - Show the commit message(s) you'll use
   - Ask: "I plan to create [N] commit(s) with these changes. Shall I proceed?"

4. **Execute upon confirmation:**
   - Keep one consistent execution context for all git write operations in this step
   - In sandboxed Codex environments, run `git add`/`git commit` with elevated permissions when required for `.git` writes
   - If a command fails with `fatal: Unable to create '.git/index.lock': Operation not permitted`, retry the same command immediately in elevated mode
   - Use `git add` with specific files (never use `-A` or `.`)
   - Quote each file path in git commands when needed to avoid shell glob expansion
   - Create commits with your planned messages
   - Show the result with `git log --oneline -n [number]`

## Environment Notes

- Read-only inspection commands (`git status`, `git diff`, `git log`) should run without elevation.
- Escalation should be limited to git write commands that update repository metadata/index.

## Important:

- **NEVER add co-author information or Claude attribution**
- Commits should be authored solely by the user
- Do not include any "Generated with Claude" messages
- Do not add "Co-Authored-By" lines
- Write commit messages as if the user wrote them

## Remember:

- You have the full context of what was done in this session
- Group related changes together
- Keep commits focused and atomic when possible
- The user trusts your judgment - they asked you to commit
