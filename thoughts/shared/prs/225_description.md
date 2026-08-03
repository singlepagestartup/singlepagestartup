## Summary

Builds the SinglePageStartup pre-development client system so Codex/ChatGPT can
turn a rough founder brief into evidence-aware business, market, communication,
brand, and concrete website-design decisions without repeated context recaps.

## Changes

- Establishes `.agents/**` as the provider-neutral source for engineering and
  client workflows, flat professional roles, invariant contracts, and tool
  capabilities; Claude/Codex adapters now route to it.
- Adds indexed `workspace/singlepage/` and clean `workspace/startup/` living
  artifacts with deterministic imports, dependencies, reverse dependencies,
  repository-aware selection, and validation fixtures.
- Migrates reusable agency knowledge/templates and removes the duplicated
  `tools/digital-agency/**` system.
- Renames Drafts atomically to SinglePageStartup Studio, preserves the existing
  component/page catalog, and integrates workspace plus engineering inventory,
  Storybook Docs, and read-only artifact views.
- Adds an isolated fictional founder pilot with current sourced research, a full
  operating process, bounded first experiment, provenance-aware identity,
  final landing/form/success copy, and nine concrete static design stories.

## Verification

- [x] `npm run singlepagestartup:agents:validate`
- [x] `npm run studio:validate`
- [x] `npm run studio:inventory`
- [x] `npm run studio:storybook:build`
- [x] `git diff --check`
- [x] Existing catalog comparison: 128 story files, 104 block manifests, 24
      page manifests, 128 Figma files, four runnable manifests, and all stable
      manifest IDs retained; Storybook grows from 149 to 165 intended entries.
- [ ] Manual review of workspace navigation, inheritance visibility, and the
      founder-pilot desktop/mobile/design compositions.

## Notes

- This stops before production implementation, external service wiring,
  analytics, client QA, and deployment. The existing GitHub-gated engineering
  workflow remains the intentional next system.
- Generated/decorative pilot SVGs are explicitly non-evidence and may not be
  presented as client work.
- `workspace/startup/` remains a reusable clean scaffold; pilot data exists only
  under `examples/founder-pilot/**`.
- The Storybook build reports existing bundle-size and `markdown-to-jsx` eval
  warnings but completes successfully.

Closes #222
