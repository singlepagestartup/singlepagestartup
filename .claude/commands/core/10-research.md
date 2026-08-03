---
description: Research codebase for GitHub issue in "Research Needed" status
model: opus
---

# Claude workflow adapter

Canonical source: `.agents/workflows/engineering/core/10-research.md`.

Read the canonical file completely and execute it in the current context. Keep
all status gates, helper calls, artifact paths, comments, checkpoints, and failure
handling exactly as defined there. Provider-specific slash-command invocation is
the only behavior supplied by this adapter.
