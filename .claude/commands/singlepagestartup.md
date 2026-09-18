---
description: Run or resume the local pre-development workflow
---

# Claude workflow adapter

Canonical source: `.agents/workflows/pre-development.md`.

Read the canonical workflow completely and execute it in the current context.
Resolve tool capability IDs through `.agents/tools/providers/claude.yaml` and
preserve all artifact, evidence, ownership, and handoff rules. Run the canonical
`singlepagestartup:github:check` preflight without a caller-selected layer before
reading the durable stage cursor. After reading that cursor, run
`npm run singlepagestartup:pipeline:check -- --format text` and use its report
as the structural part of the mandatory pipeline compatibility reconciliation
from `.agents/contracts/pipeline-reconciliation.md` before accepting its stage or
launching an owner; treat its repository-derived layer as
authoritative and never bypass it with a stale local comparison.
