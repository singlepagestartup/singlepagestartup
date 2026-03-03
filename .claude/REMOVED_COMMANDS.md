# Removed Commands

The following commands were removed as part of the linear cycle workflow refactoring (2026-03-04).

## Deleted Files

| File                           | Replaced By                | Reason                                             |
| ------------------------------ | -------------------------- | -------------------------------------------------- |
| `create_plan_nt.md`            | `core/20-plan.md`          | \_nt variant — skipped thoughts/, no longer needed |
| `create_plan.md`               | `core/20-plan.md`          | Superseded by unified plan command                 |
| `create_plan_generic.md`       | `core/20-plan.md`          | Superseded by unified plan command                 |
| `iterate_plan_nt.md`           | `core/20-plan.md`          | \_nt variant — functionality merged into 20-plan   |
| `iterate_plan.md`              | `core/20-plan.md`          | Functionality merged into 20-plan (create + sync)  |
| `iterate_plan_external.md`     | `core/20-plan.md`          | Autonomous sync merged into 20-plan                |
| `research_codebase_nt.md`      | `core/10-research.md`      | \_nt variant — no longer needed                    |
| `research_codebase.md`         | `core/10-research.md`      | Superseded by unified research command             |
| `research_codebase_generic.md` | `core/10-research.md`      | Superseded by unified research command             |
| `describe_pr_nt.md`            | `utilities/describe_pr.md` | \_nt variant — no longer needed                    |
| `ci_describe_pr.md`            | `utilities/describe_pr.md` | CI variant — integrated into implement phase       |
| `ci_commit.md`                 | `utilities/commit.md`      | CI variant — plain commit.md is sufficient         |

## Moved Files

| Old Path         | New Path                   |
| ---------------- | -------------------------- |
| `commit.md`      | `utilities/commit.md`      |
| `describe_pr.md` | `utilities/describe_pr.md` |
