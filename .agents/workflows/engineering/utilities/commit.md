---
description: Create git commits with user approval and no Claude attribution
---

# Commit Changes

You are tasked with creating git commits for the changes made during this session.

Read `.agents/contracts/engineering/downstream-migrations.md`. Every commit must
preserve the downstream adaptation context while the conversation is available.

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
   - Assess inherited code and child-owned overrides/documents against the
     conversation and each commit's diff. Append the contract's downstream
     trailers: impact, reason, and (when required) applicability, actions, and
     verification. Explain semantic migrations that a clean merge will not do.
   - For removed references, specify how the child recovers and preserves their
     meaning; deleting matching identifiers alone is not a migration.

3. **Present your plan to the user:**

   - List the files you plan to add for each commit
   - Show the commit message(s) you'll use
   - Include the downstream instructions in the reviewable message. A user's
     explicit request to commit is authorization; do not ask again. If creating
     a commit was not authorized, prepare the change and message before asking.

4. **Execute when authorized:**
   - Keep one consistent execution context for all git write operations in this step
   - In sandboxed Codex environments, prefer running the first `git add`/`git commit` block with elevated permissions up front because `.git` metadata writes commonly fail without it
   - If a command fails with `fatal: Unable to create '.git/index.lock': Operation not permitted`, retry the same command immediately in elevated mode
   - Use `git add` with specific files (never use `-A` or `.`)
   - Quote each file path in git commands when needed to avoid shell glob expansion
   - Review `git diff --cached` after staging; exclude unrelated changes and
     reconcile the message with the exact staged content.
   - Write the full message to a temporary file with literal newlines. Validate
     it using `node tools/upstream/migrations.mjs message --file <message-file>`;
     fix missing or misleading guidance before `git commit -F <message-file>`.
   - Read the committed diff after hooks run and validate the actual message
     (`git log -1 --format=%B` saved to a temporary file through a safe API or
     redirection). If a hook changed scope or text, correct the local commit
     before publication; never silently publish stale migration instructions.
   - Show the result with `git log --oneline -n [number]`
   - When preparing a PR or an authorized squash/reword operation, preserve the
     migration instructions as described in the downstream contract.

## Environment Notes

- Read-only inspection commands (`git status`, `git diff`, `git log`) should run without elevation.
- In Codex sandbox sessions, it is acceptable and preferred to request elevation before the first git write block instead of paying for an expected `.git/index.lock` failure.
- Escalation should still be limited to git write commands that update repository metadata/index.

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

## Final editorial pass

When the work contains prose intended for a person, apply
`.agents/contracts/editorial-pass.md` after the facts, evidence, links,
identifiers, required structure, and approval state are correct. This is the
last content-editing step before returning or storing the text.
