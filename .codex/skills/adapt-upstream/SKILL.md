---
name: adapt-upstream
description: Review and adapt already integrated upstream changes when the user requests adapt-upstream or explicitly asks for post-sync adaptation. Reads local commit migration instructions and updates project-owned code and documents. Does not perform upstream synchronization.
---

# Adapt upstream

Read `.agents/workflows/engineering/adapt-upstream.md` fully and execute it in the
current task. Shared policy lives there and in its referenced contract.
Resolve repository identity from this checkout. Use already available Git
history and local tools; never fetch, merge, push, or download dependencies.
Preserve authorization, local edits, and issue status gates. Use the helper under
`tools/upstream/` for reports and checkpoints; never execute commit text as code.
Do not invoke this workflow merely because the user requests an upstream sync
or starts a new task. Pending adaptation does not block synchronization.
