---
description: Analyze recent commit/session context to improve shared .claude and .codex workflows
---

# Claude workflow adapter

Canonical source: `.agents/workflows/engineering/utilities/post_commit_retro.md`.

Read the canonical file completely and execute it in the current context. Keep
all status gates, helper calls, artifact paths, comments, checkpoints, and failure
handling exactly as defined there. Provider-specific slash-command invocation is
the only behavior supplied by this adapter.
