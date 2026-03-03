# Claude Code Commands

This directory contains commands for the SPS development workflow.

## Core Linear Cycle Commands

The main development workflow uses these unified commands with explicit phase gates:

| Command                | Purpose                            | Status Entry    | GitHub Status                        |
| ---------------------- | ---------------------------------- | --------------- | ------------------------------------ |
| `core/next.md`         | Auto-dispatch to the correct phase | Any             | Reads status, routes automatically   |
| `core/00-create.md`    | Create new issue                   | None            | Triage → Research Needed             |
| `core/10-research.md`  | Research codebase                  | Research Needed | Research Needed → Research in Review |
| `core/20-plan.md`      | Create implementation plan         | Ready for Plan  | Ready for Plan → Plan in Review      |
| `core/30-implement.md` | Implement approved plan            | Ready for Dev   | Ready for Dev → Code Review          |

**Linear Pipeline**:

```
create → research → plan → implement → done
```

Each command has an explicit **status gate** — you can only proceed when the issue is in the correct GitHub Project status.

After phases that require human review (Research in Review, Plan in Review): manually advance the issue status in GitHub Project, then run `/core/next` again.

After PR merge: manually move the issue to "Done" in GitHub Project.

## Utility Commands

Supporting commands used by the main workflow:

| Command                    | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `utilities/commit.md`      | Create git commits (used by implement phase)       |
| `utilities/describe_pr.md` | Generate PR descriptions (used by implement phase) |

## Special Purpose Commands

These commands serve specific needs outside the main linear cycle:

| Command                   | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| `debug.md`                | Investigate logs, database state, and git history |
| `founder_mode.md`         | Post-hoc workflow for experimental features       |
| `linear.md`               | Linear ticket management                          |
| `create_worktree.md`      | Create git worktree for implementation            |
| `local_review.md`         | Setup worktree for reviewing colleague's branch   |
| `validate_plan.md`        | Validate implementation against plan              |
| `create_handoff.md`       | Create handoff document                           |
| `resume_handoff.md`       | Resume work from handoff                          |
| `setup_github_project.md` | Create GitHub Project with workflow               |
| `github.md`               | GitHub Project issue management                   |
| `github_status.md`        | Check GitHub issue status                         |

## Legacy Ralph Loop Commands

These commands are the original Ralph Loop workflow. They remain functional but the new `core/` commands provide a more unified approach with explicit phase gates:

| Command             | Purpose                       |
| ------------------- | ----------------------------- |
| `ralph_research.md` | Research phase (legacy)       |
| `ralph_plan.md`     | Planning phase (legacy)       |
| `ralph_impl.md`     | Implementation phase (legacy) |

## Workflow Statuses

The GitHub Project uses these statuses to gate progress:

| Status                                                      | Purpose                              |
| ----------------------------------------------------------- | ------------------------------------ |
| Triage                                                      | Initial review and categorization    |
| Spec Needed                                                 | More detail required before research |
| Research Needed → Research in Progress → Research in Review | Investigation phase                  |
| Ready for Plan → Plan in Progress → Plan in Review          | Planning phase                       |
| Ready for Dev → In Dev → Code Review                        | Implementation phase                 |
| Done                                                        | Completed                            |

## Using the Commands

Each command is invoked via `/command_name` in Claude Code:

```
/core/next 142        # recommended — auto-detects phase and runs the right command
/core/00-create       # create a new issue from scratch
/core/10-research 142 # run directly if needed
/core/20-plan 142
/core/30-implement 142
```

For issue-specific commands, specify the issue number as argument.

If no issue number is provided, the command will prompt you to select one from the appropriate GitHub Project status.
