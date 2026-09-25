## Summary

Builds the SinglePageStartup pre-development system so Codex/ChatGPT can
turn a rough founder brief into evidence-aware business, market, communication,
brand, and concrete website-design decisions without repeated context recaps.

## Changes

- Establishes `.agents/**` as the provider-neutral source for engineering and
  pre-development workflows, flat professional roles, invariant contracts, and tool
  capabilities; Claude/Codex adapters now route to it.
- Registers all seven pre-development professions as native Codex and Claude
  agents. Their thin adapters load one canonical role containing both
  responsibility and professional method; source links stay in a
  provenance-only register.
- Adds indexed singlepage sources and zero-content startup sources colocated
  with their Studio stories. A committed workspace config defaults downstream
  checkouts to `startup` and maps the canonical framework checkout to
  `singlepage`, without requiring an environment variable.
- Requires every startup index entry to declare its `extends` target and merge
  strategy: section overlays for living documents, keyed overlays for assets,
  scoped keyed rows for evidence, and replacement for niche-specific knowledge.
  Validation covers pass-through, overrides, imports, dependency routing,
  invalid inheritance, and evidence scope.
- Defines the canonical `.agents/workflows/pre-development.md` process as
  numbered `00/10/20/30` stages and adds a minimal layer-local cursor that is
  reconciled from living artifacts whenever a fresh model context resumes work.
- Adds a domain decision-profile source per layer and resolves it through an
  explicit replacement overlay. Understand
  classifies potentially compound business models; material questions, metrics,
  evidence, risks, regulations, and viability rules are assigned to
  artifacts/stages and must pass before fluent but generic output can be
  accepted. Professional methods and benchmarks are sourced and selected only
  when their fit and limitations are explicit.
- Consolidates project configuration, indexes, project-specific knowledge,
  living sources, and presentation under `apps/studio/workspace/**` so agents
  have one unambiguous business-workspace root.
- Uses an artifact-first directory layout: each business or knowledge folder
  contains its `singlepage`, `startup`, and Storybook projection, while indexes
  and pre-development cursors live in dedicated top-level folders. The former
  `stories/project` and layer-first knowledge roots no longer exist.
- Places invariant profession methods, eight final-artifact templates, and one
  decision-profile routing template beside the agents under `.agents/**`; the
  documented order follows the approved four-stage pipeline, while domain,
  discovery, acquisition, and communication work retains distinct
  singlepage/startup sources in Studio.
- Migrates reusable agency material and removes the duplicated
  `tools/digital-agency/**` system; issue #226 tracks deletion of the two
  compatibility records after downstream projects migrate.
- Renames Drafts atomically to SinglePageStartup Studio, preserves the existing
  component/page catalog, and adds readable per-artifact Storybook folders that
  import canonical business, marketing, brand, and design sources directly.
- Uses SinglePageStartup itself as the live business project and presents the
  resolved colocated `singlepage` plus optional `startup` overrides without a
  parallel fictional example.

## Verification

- [x] `npm run singlepagestartup:agents:validate`
- [x] `npm run studio:validate`
- [x] `npm run studio:inventory`
- [x] `npm run studio:storybook:build`
- [x] Pre-development cursor schema and stage ownership validation
- [x] Explicit inheritance strategies, evidence scope, and active-layer dependency fixtures
- [x] `git diff --check`
- [x] Existing catalog comparison: 128 story files, 104 block manifests, 24
      page manifests, 128 Figma files, four runnable manifests, and all stable
      manifest IDs retained; the production Storybook index contains 211
      intended entries after adding the complete Workspace projections.
- [ ] Manual review of workspace navigation, inherited sections, and downstream
      Markdown overrides.

## Notes

- This stops before production implementation, external service wiring,
  analytics, QA, and deployment. The existing GitHub-gated engineering
  workflow remains the intentional next system.
- Colocated `singlepage` files are the framework's real business project.
- Colocated `startup` files start empty and contain only downstream overrides;
  Studio presents the resolved `current` result alongside isolated `singlepage`
  and `startup` sources.
- In a startup project, inherited singlepage evidence remains provenance only;
  a startup-scoped row must explicitly adopt, replace, or reject it before it can
  support a downstream claim.
- The Storybook build reports existing bundle-size and `markdown-to-jsx` eval
  warnings but completes successfully.

Closes #222
