---
description: Legacy wrapper for implementation flow (delegates to core/30-implement with the same quality gates)
model: sonnet
---

# Claude workflow adapter

Canonical source: `.agents/workflows/engineering/ralph_impl.md`.

Read the canonical file completely and execute it in the current context. Keep
all status gates, helper calls, artifact paths, comments, checkpoints, and failure
handling exactly as defined there. Provider-specific slash-command invocation is
the only behavior supplied by this adapter.
