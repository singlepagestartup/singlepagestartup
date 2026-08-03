---
description: Create git commits with user approval and no Claude attribution
---

# Claude workflow adapter

Canonical source: `.agents/workflows/engineering/utilities/commit.md`.

Read the canonical file completely and execute it in the current context. Keep
all status gates, helper calls, artifact paths, comments, checkpoints, and failure
handling exactly as defined there. Provider-specific slash-command invocation is
the only behavior supplied by this adapter.
