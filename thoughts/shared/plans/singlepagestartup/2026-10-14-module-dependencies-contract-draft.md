---
status: applied
source_date: 2026-10-14
scope: shared-review-policy
activation: active
canonical_source: .agents/contracts/engineering/module-dependencies.md
confirmation: operator-confirmed
---

# Module dependency contract

The active [module dependency contract](../../../../.agents/contracts/engineering/module-dependencies.md)
contains the confirmed fifteen-module order. It governs production imports and
reexports across backend, schemas, SDKs, frontend and types.

`AGENTS.md`, `CLAUDE.md` and `.agents/workflows/engineering/review_pr.md` require
reviewers to read that contract and report upward imports. The Codex skill and
Claude command route to the shared review workflow. The root README links the
same contract; this plan keeps no second editable copy of its rules.
