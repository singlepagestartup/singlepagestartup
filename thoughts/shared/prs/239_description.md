## Summary

AI Chat now has the same complete product set as Code Framework, every product owns an Analytics document, and Design carries a reusable interface language with rendered specimens. Product navigation groups Product, Operations & Economics, Sales, Promotion and Analytics without merging their sources. The agent system enforces a final editorial pass on every human-facing output, Strategy is defined as one target-state picture of the project, and Studio validation gains brandbook and specimen checks so a downstream project cannot pass 30-design on inherited framework design.

## Changes

- AI Chat: route-level website pages with paired Text/Layout, selected marketing creative, segment and competitor research pages, guided-cards and workspace-map Product Content, revised presentation data and layout, revised Product, Sales, Research and Website overview.
- Analytics: `analytics.md` for both products from the new `product-analytics` template; the review resolver adds Analytics as an input of Research and tracks page-level `uses`; product validation requires the canonical Analytics headings.
- Navigation: `ProductCatalog` and `ProductPages` group Overview/Content inside Product, Website/Marketing Creative/Presentation inside Promotion, and observations/Research inside Analytics.
- Design: `Interface and product surfaces` section, inline `interface-kit.html` and `content-blocks.html` specimens, interface review metadata, layout and renderer support for the interface block.
- Shared documents: Strategy rewritten as a target state, Brand and Brief aligned, operator confirmations and GitHub reconciliation rows recorded.
- Agent system: `editorial-pass` contract, Codex `unslop` skill, closing editorial section in every workflow, role and skill enforced by `agents:editorial:test`; target-state Strategy rule and Promotion/Analytics contract in workflow, roles, templates, `CLAUDE.md` and `AGENTS.md`; restructured website template.
- Validation: `brandbook` check (downstream at `30-design` must own `design/startup.md` and at least one `assets/startup.yaml` row) and `specimens` check (`data-specimen="<id>"` for each required specimen or an attributed `interface_review.omitted_specimens` reason) wired into `studio:validate`; structure test updated for the nested Content badge; second Storybook launch port.
- CodeQL: the brandbook check now uses the exported `hasMarkdownContent` scanner from the workspace document module instead of a regex replace chain, which resolved the new `js/incomplete-multi-character-sanitization` alert on this PR.
- Tooling hygiene: `.nxignore` and `.gitignore` exclude `.claude/worktrees`, because a Claude Code worktree inside the checkout made Nx refuse every target with duplicate project names.

## Verification

- [x] `npm run studio:validate` — type check, manifests, design-system and workspace validators for both layers with self-check, `agents:editorial:test`, 169 Studio tests across 20 files, and the GitHub reconciliation tests all pass.
- [x] `npm run studio:storybook:build` — production Storybook build completed successfully.
- [ ] Browser review of the Promotion and Analytics tabs, the AI Chat page tree and the Design interface kit — not performed in this session.

## Notes

- This snapshot commits the working tree of an in-progress Codex session on this branch as of 2026-09-18 02:04 local time; the one test that had drifted from the rewritten `ProductCatalog` was updated to the new nested labels.
- No database schema or runtime code changes; everything is under `apps/studio`, `.agents`, `.codex`, `.claude`, `tools` and the two entry files.
- Three older alerts for the same CodeQL rule remain open on `main` in `tools/studio/workspace/merge.ts`, `apps/studio/workspace/utils/design/data.ts` and `tools/studio/presentation/export.ts`; they predate this PR and can be replaced with the same scanner in a follow-up.

## Downstream migration

Shared validators now require an Analytics source per product, downstream ownership of Design and assets from `30-design`, and `data-specimen` markup for a documented interface section. The editorial-pass contract and the target-state Strategy rule are pipeline changes that reconciliation applies to owned documents.

Applies to projects with their own product catalog, a cursor at or after `30-design`, a Design containing an `Interface and product surfaces` section, custom Studio product or design renderers, or an owned Strategy written as a roadmap.

- Add `analytics.md` for each owned product from `.agents/templates/product-analytics.md`, declare it in the startup catalog and record unavailable measurements as `not measured`; never copy framework observations or infer zero values.
- When the startup cursor is at or after `30-design`, write and separately confirm `design/startup.md` and register at least one asset in `assets/startup.yaml`; an empty inherited Design no longer passes validation.
- If the owned Design documents an `Interface and product surfaces` section, render each required specimen with `data-specimen="<id>"` in a layer-owned kit or record an attributed reason under `interface_review.omitted_specimens`.
- Review the owned Strategy against the target-state rule and the Promotion/Analytics grouping; repair the startup source only, preserve confirmed facts and do not renew approval hashes.
- Adapt any owned `ProductCatalog`, `ProductPages`, `ProjectDesign` or `DesignRenderer` overrides to the Promotion and Analytics groups, the interface block and the Analytics review edges.

Verify with `npm run studio:validate` and `npm run studio:storybook:build`, open the resolved `default` projection, and check that Product, Sales, Promotion and Analytics render for each owned product, the Design interface kit shows its specimens, and confirmation states are unchanged except where documents were intentionally revised.
