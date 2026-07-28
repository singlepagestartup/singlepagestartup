# Knowledge-First Contract

This contract defines how workflow agents look up information. Its goal is to spend tokens once and reuse the result: consult recorded knowledge first, search the codebase last, and leave behind artifacts that make the next lookup cheaper.

It applies to every workflow phase (`core/00-create` through `core/30-implement`) and to every provider executing the canonical commands.

## Lookup Order

Before any broad codebase search (repo-wide grep, exploratory sub-agent sweeps, reading many files "to get oriented"), check these sources in order. Stop as soon as the question is answered; verify instead of re-deriving.

1. **Process log** — `thoughts/shared/processes/<repo>/ISSUE-N.md`
   Incidents, root causes, fixes, and reusable learnings for this issue. Never re-debug a problem that is already recorded here.
2. **Ticket** — `thoughts/shared/tickets/<repo>/ISSUE-N.md` plus GitHub issue comments
   The requirements and any clarifications already given by the operator.
3. **Existing research and plans** — `thoughts/shared/research/<repo>/` and `thoughts/shared/plans/<repo>/`
   For this issue and for related issues (search by component/topic via `thoughts-locator` or filename). These contain verified `file:line` references — start from them.
4. **Documentation order** — root `README.md` → `libs/modules/<module>/README.md` → `libs/modules/<module>/models/<model|relation>/README.md`
   The cheapest way to understand a module's structure and conventions.
5. **Targeted investigation** — `codebase-locator` / `codebase-analyzer` / `codebase-pattern-finder` sub-agents (or their provider equivalent) with a narrow, specific question.
6. **Broad search** — only when the previous steps did not answer the question.

## Reuse With Verification

Recorded knowledge can be stale. The rule is **reuse, then verify the load-bearing claims** — not re-research from scratch:

- When an existing research document covers the topic, read it and spot-check only the claims the current phase depends on (does the file still exist? does the function still have that signature?). Use `git log -- <file>` or a direct read of the referenced lines; do not relaunch a full research sweep.
- If a verified claim turned out stale, update the research document (or record the correction in the process log) so the next agent does not hit the same staleness.
- Live code always wins over recorded notes when they conflict — and the conflict itself must be recorded.

## Write-Back Duty

Every lookup that required real effort must make the next lookup cheaper:

- Answered a question by searching the codebase? Record the answer (with `file:line`) in the artifact of the current phase — research doc, plan, or process log — whichever the next phase will read.
- Hit a wrong assumption, tooling failure, or dead end? Record it as an incident in the process log per `.claude/references/process-artifact-contract.md`.
- Discovered something reusable beyond this issue (a helper quirk, a framework rule, a workflow gap)? Promote it to `## Reusable Learnings` in the process log; if it is framework-level, propose a change to the shared `.claude` / `.codex` / `AGENTS.md` files via `utilities/post_commit_retro.md`.

## Anti-Patterns

- Re-running a full research sweep when a research document for the issue already exists and review feedback only touched one section.
- Spawning sub-agents to "explore the codebase" without a specific question that steps 1–4 failed to answer.
- Reading entire large files when the artifact already pins the relevant `file:line` range — read the pinned range plus minimal surrounding context. (Files explicitly named in the ticket or plan as required full reads are still read fully.)
- Answering from memory of a previous session instead of from the artifacts — artifacts are the cross-session memory, chat history is not.
- Leaving a hard-won answer only in the chat: if it is not in an artifact, the tokens spent finding it are lost.
