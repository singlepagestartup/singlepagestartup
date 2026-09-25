---
description: Legacy wrapper for research flow (delegates to core/10-research with the same quality gates)
model: opus
---

# Claude workflow adapter

Canonical source: `.agents/workflows/engineering/ralph_research.md`.

Read the canonical file completely and execute it in the current context. Keep
all status gates, helper calls, artifact paths, comments, checkpoints, and failure
handling exactly as defined there. Provider-specific slash-command invocation is
the only behavior supplied by this adapter.
