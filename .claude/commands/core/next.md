---
description: Determine and run the next workflow phase for a GitHub issue based on its current status
model: sonnet
---

# Claude workflow adapter

Canonical source: `.agents/workflows/engineering/core/next.md`.

Read the canonical file completely and execute it in the current context. Keep
all status gates, helper calls, artifact paths, comments, checkpoints, and failure
handling exactly as defined there. Provider-specific slash-command invocation is
the only behavior supplied by this adapter.
