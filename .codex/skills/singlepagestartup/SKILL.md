---
name: "singlepagestartup"
description: "Starts, resumes, or updates the quality-gated pre-development workflow, reconciles relevant GitHub changes before each invocation, asks for missing operator facts, obtains required approvals, and maintains its living artifacts."
---

# singlepagestartup

Canonical source: `.agents/workflows/pre-development.md`.

Read the canonical workflow completely and execute it in the current Codex
thread. Resolve provider-neutral capabilities through
`.agents/tools/providers/codex.yaml`. Run the canonical
`singlepagestartup:github:check` preflight without a caller-selected layer before
reading the durable stage cursor. After reading that cursor, run
`npm run singlepagestartup:pipeline:check -- --format text` and use its report
as the structural part of the mandatory pipeline compatibility reconciliation
from `.agents/contracts/pipeline-reconciliation.md` before accepting its stage or
launching an owner. It uses the shared repository-layer resolver;
treat its reported layer as authoritative and never bypass it with a stale
local comparison. Natural-language requests to start, continue, inspect, or
change the active project before engineering route to this skill.

## Final editorial pass

When this skill writes or returns prose intended for a person, load the project
`unslop` skill and apply `.agents/contracts/editorial-pass.md` after the
canonical workflow is complete. Preserve exact facts, evidence, identifiers,
paths, commands, required structure, and approval state.
