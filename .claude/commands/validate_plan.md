---
description: Validate plan quality or implementation execution with explicit audit modes
---

# Validate Plan

Use this command to run one of two validation modes:

1. **Pre-Implementation Audit** (before coding starts)
2. **Post-Implementation Validation** (after coding is done)

If mode is not specified, default to **Pre-Implementation Audit**.

## Modes

### Mode A: Pre-Implementation Audit (blocking gate)

Goal: prove that ticket, research, and plan are consistent and executable.

#### Required Inputs

- Ticket: `thoughts/shared/tickets/REPO_NAME/ISSUE-{NUMBER}.md`
- Research: `thoughts/shared/research/REPO_NAME/ISSUE-{NUMBER}.md` (or latest linked research)
- Plan: `thoughts/shared/plans/REPO_NAME/*ISSUE-{NUMBER}*.md`

#### Audit Checks (all mandatory)

1. **Ticket vs Research vs Plan consistency**

   - Verify critical claims are aligned across all three artifacts.
   - Highlight contradictions explicitly with evidence (`file:line`).

2. **Path validity**

   - Every referenced file/directory in plan/research must exist.
   - Report missing/renamed paths as blocking findings.

3. **Command/target validity**

   - Every verification command in the plan must exist in repo config.
   - For Nx commands, verify project target exists in `project.json`.
   - Reject guessed commands.

4. **Assumption quality**

   - Classify assumptions as:
     - `verified` (backed by code/docs)
     - `unsupported` (no evidence)
     - `stale` (conflicts with current code)
   - Unsupported/stale assumptions are blockers unless explicitly accepted by user.

5. **Blocking section enforcement**
   - Ensure unresolved contradictions are listed in `Open Questions (Blocking)`.
   - If blocking questions are unresolved, audit must fail.

#### Pre-Implementation Audit Output

```markdown
## Pre-Implementation Audit Report

### Overall Result

- PASS | FAIL

### Consistency Matrix

| claim | ticket | research | plan | status | evidence |

### Missing Paths

- path + source reference

### Invalid or Unverified Commands

- command + why invalid + where referenced

### Unsupported / Stale Assumptions

- assumption + status + evidence

### Blocking Contradictions

- contradiction + required clarification

### Required Actions Before Implementation

1. ...
2. ...
```

If result is `FAIL`, do not proceed to implementation.

---

### Mode B: Post-Implementation Validation

Goal: verify implementation matches approved plan and success criteria.

#### Checks

1. Compare plan phases vs actual code changes.
2. Run automated verification commands from the plan.
3. Report deviations (intentional/unintentional).
4. List manual checks still required from reviewer.

#### Post-Implementation Output

```markdown
## Post-Implementation Validation Report

### Phase Completion

- Phase N: complete / partial / missing

### Automated Verification

- command: pass/fail

### Deviations from Plan

- file:line + explanation

### Residual Risks

- risk description

### Manual Verification Checklist

- [ ] item
```

## Process

1. Resolve issue number and repository namespace.
2. Locate ticket/research/plan artifacts.
3. Run selected mode checks.
4. Emit structured report with explicit PASS/FAIL.
5. If FAIL in pre-implementation audit, stop and request clarification/update.

## Rules

- Do not invent missing evidence.
- Do not mark assumptions as facts without proof.
- Prefer explicit blockers over optimistic guesses.
- Keep findings evidence-based (`file:line`, command source, config path).
