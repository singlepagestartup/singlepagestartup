---
description: Analyze recent commit/session context to improve shared .claude and .codex workflows
---

# Post-Commit Retro

You are tasked with running a lightweight workflow retrospective after a commit or after a session that exposed friction in the AI workflow.

The purpose is not to review product code quality. The purpose is to improve the agent operating system around the codebase: `.claude` commands, `.codex` skills, shared helper scripts, prompts, handoff patterns, and workflow ergonomics.

## When to Use

Use this command when one or more of the following happened:

- A task required avoidable retries, clarification loops, or manual recovery.
- `.claude` and `.codex` behavior diverged unexpectedly.
- A helper script, command contract, or skill prompt was unclear or missing.
- Sandbox/network/git/tooling friction slowed execution.
- A task was completed successfully, but the path was slower or less reliable than it should be.

Typical timing:

- immediately after a commit;
- after finishing a GitHub issue phase;
- after noticing repeated friction across multiple sessions.

## Inputs

Accept any of:

- optional issue number;
- optional commit SHA (default: latest local commit);
- optional scope: `.claude`, `.codex`, or `shared` (default: `shared`);
- optional focus note from the user describing what felt slow or brittle.

If no issue number is given, infer one only when there is a clear local artifact or branch/commit context. Otherwise proceed without forcing issue linkage.

## Process

1. **Collect the execution context**

   - Review the recent conversation or user-provided summary.
   - Inspect the latest commit if relevant.
   - Inspect the local workflow artifacts tied to the task when they exist:
     - `thoughts/shared/tickets/...`
     - `thoughts/shared/research/...`
     - `thoughts/shared/plans/...`
     - `thoughts/shared/handoffs/...`
   - Inspect the workflow files most likely involved in the friction:
     - `.claude/commands/**/*.md`
     - `.claude/helpers/*.sh`
     - `.claude/agents/*.md`
     - `.codex/skills/**/SKILL.md`
     - `.codex/agents/*.toml`

2. **Identify workflow problems**

   Focus on problems in the agent framework, not application behavior.

   Look for:

   - duplicated instructions between `.claude` and `.codex`;
   - missing canonical source ownership;
   - vague skill trigger descriptions;
   - brittle path assumptions;
   - missing helper scripts for repeated shell sequences;
   - status gate mismatches;
   - repeated sandbox/network/escalation friction;
   - command steps that depend on hidden knowledge from the operator;
   - places where the same fix would reduce time for future tasks.

3. **Classify each finding**

   For every substantive finding, classify:

   - **Surface**: `.claude`, `.codex`, or `shared`
   - **Type**: prompt, command contract, helper script, artifact structure, validation gap, or automation opportunity
   - **Impact**: speed, reliability, portability, or maintainability
   - **Recommended fix shape**: doc update, helper script, wrapper skill, command refactor, hook, or automation

4. **Prefer systemic fixes**

   Do not stop at "the agent made a mistake".

   Push toward changes that improve future execution:

   - centralize the canonical workflow in one file;
   - reduce duplication between `.claude` and `.codex`;
   - add a helper for repeated shell logic;
   - add a guardrail/checklist where failure is predictable;
   - recommend a hook or automation only when event-driven/manual workflow is not sufficient.

5. **Write the retrospective artifact**

   Save the output to:

   - issue-specific:
     - `thoughts/shared/retrospectives/REPO_NAME/ISSUE-<number>/YYYY-MM-DD_HH-MM-SS.md`
   - otherwise:
     - `thoughts/shared/retrospectives/REPO_NAME/YYYY-MM-DD_HH-MM-SS.md`

   `REPO_NAME` must be resolved from `.claude/helpers/get_repo_name.sh`; do not use bare `gh repo view` for artifact namespaces.

   Use this structure:

   ```markdown
   # Post-Commit Retro

   ## Metadata

   - Date: YYYY-MM-DD HH:MM:SS
   - Scope: shared | .claude | .codex
   - Issue: ISSUE-123 | none
   - Commit: <sha> | none

   ## Context

   Short summary of the task/session that exposed the workflow friction.

   ## Findings

   ### 1. <Short title>

   - Surface:
   - Type:
   - Impact:
   - Evidence:
   - Root cause:
   - Recommended fix:

   ## Quick Wins

   - Changes that should be easy to implement immediately.

   ## Structural Improvements

   - Changes that would improve multiple future tasks.

   ## Proposed Next Actions

   1. ...
   2. ...
   3. ...
   ```

6. **Return an actionable summary**

   In the final response:

   - link the retrospective artifact;
   - summarize the highest-value findings;
   - state whether the next step should be:
     - a new skill,
     - a helper script,
     - a command/skill refactor,
     - a git hook,
     - or an automation.

## Guardrails

- Keep the retrospective focused on the agent framework, not general code review.
- Do not invent workflow problems without evidence from the session or inspected files.
- Prefer a small number of high-confidence findings over a long speculative list.
- If no meaningful workflow issue is found, say so explicitly and record only one short artifact with the evidence checked.
- If the best solution is event-driven after every commit, recommend a git hook or commit wrapper before recommending a time-based automation.

## Important

This command is meant to improve execution speed and reliability across different agent runtimes. Favor solutions that are portable between Claude-style commands and Codex-style skills whenever possible.
