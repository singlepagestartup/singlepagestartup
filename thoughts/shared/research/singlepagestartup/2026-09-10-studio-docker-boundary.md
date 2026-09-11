---
repository: singlepagestartup/singlepagestartup
date: 2026-09-10
status: implemented-locally
---

# Studio production Docker boundary

The operator requested a framework-wide rule excluding all Studio files from production Docker images so downstream projects do not ship growing design and content workspaces.

## Implementation

- Root `.dockerignore` excludes `apps/studio` in full, including future files.
- `apps/studio/README.md` documents the production boundary, publishing approved content through runtime-owned data/assets, external knowledge corpus configuration, and preserving the exclusion in downstream/custom Docker contexts.
- Host code, module data snapshots, and Studio source files in Git remain available in their existing locations.
- Existing uncommitted Studio PDF-export changes, including the README section, were preserved.

## Verification

- Actual Docker build from the framework root, with a temporary `FROM scratch` Dockerfile: copying `apps/host/package.json` and an existing website-builder widget JSON dump succeeds.
- A second build attempting to copy the existing `apps/studio/README.md` fails with the expected source `not found`, confirming exclusion from the context.
- `git diff --check` passes for the files changed by this task.
- Full production build, commit, push, and deployment were not performed in this task.

## Adoption

Downstream projects receive this rule when the framework change is committed, published, and synced. This reduces build context and image contents; it does not by itself diagnose or prevent every runner memory or infrastructure failure.
