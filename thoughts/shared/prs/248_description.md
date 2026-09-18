## Summary

Phase 2 of compacting the pre-development instruction corpus: the structural rules that the workflow and contracts describe in prose now exist once as an executable stage machine. `.agents/pipeline/pre-development.yaml` declares every stage with its owners, active artifacts, checks, manual-review criteria and legacy-shape detectors; `npm run singlepagestartup:pipeline:check` evaluates a workspace against it and reports gaps, the computed cursor and detected legacy shapes without writing anything. This is additive: no prose rule moves yet, and the command runs in report mode.

## Changes

- `.agents/pipeline/pre-development.yaml`: five stages in cursor order, 23 checks, manual-review criteria per stage, six legacy-shape detectors that point at the existing migration procedures.
- `tools/singlepagestartup/pipeline/definition.ts`: loads and validates the definition (schema, stage order, known check kinds, owners with role files, templates that exist).
- `tools/singlepagestartup/pipeline/checks.ts`: the checks. Confirmation gates use the shared review resolver and require the active layer; Brief scope and visual intake are read from the layer's own file, so inherited framework metadata never satisfies a startup gate; template sections come from the templates; catalog structure, brandbook ownership and specimen checks reuse the existing validators.
- `tools/singlepagestartup/pipeline/check.ts`: the command. JSON by default, `--format text` for a summary, `--layer` assertion and `--repository` identity override like the GitHub preflight, `--enforce` for a non-zero exit on gaps.
- `tools/singlepagestartup/pipeline/fixture.ts`: builds a complete downstream repository in a temp directory, with startup-owned documents, valid confirmation fingerprints and input snapshots, a product with model, research, analytics and Sales v2, and registered generated assets.
- `tools/singlepagestartup/pipeline/check.test.ts`: ten BDD scenarios covering the definition, a complete downstream project, an unconfirmed Strategy, an empty startup layer, missing generated files and blocked sales, legacy shapes, an inherited base section, enforce mode and agreement with the review resolver on this repository.
- `package.json`, `project.json`: `singlepagestartup:pipeline:check`, `singlepagestartup:pipeline:test`; `studio:validate` runs the tests and prints the report.
- `.agents/workflows/pre-development.md`, `.agents/README.md`, `.claude/commands/singlepagestartup.md`, `.codex/skills/singlepagestartup/SKILL.md`: one paragraph each pointing at the command as the structural half of pipeline reconciliation.

## Verification

- [x] `npm run singlepagestartup:pipeline:test` — 10 scenarios pass.
- [x] `npm run studio:validate` — 171 Studio tests, 10 pipeline tests, both workspace layers, editorial and GitHub reconciliation tests pass; the pipeline report prints at the end of the target.
- [x] `npm run singlepagestartup:pipeline:check -- --format text` on this repository reproduces the phase-1 goldens: 19 checks pass, 3 approval gaps (Strategy, Brand, Design stale), 1 decision gap (AI Chat sales), no structural gaps, no legacy shapes.
- [x] Same command with `--repository example/downstream`: the empty startup layer is held at Client Request because the inherited scope does not count.
- [x] Resolved workspace snapshot diffed against `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-goldens.txt`: identical, 182 entries.
- [x] Ad hoc `tsc --noEmit --strict` over the new module: no errors.

## Notes

- Report on this repository (`singlepage`): 00-business complete; Strategy, Brand and Design blocked on stale confirmations; AI Chat sales blocked on four business decisions; computed cursor 10-strategy/blocked against the recorded 40-products. This matches the goldens recorded in phase 1.
- Report as a downstream repository with the empty startup layer: Client Request blocked because the inherited scope confirmation does not count, visual intake not recorded in the startup layer.
- Two findings surfaced by the fixture and left for later phases: the brandbook validator fingerprints the raw startup file while the review resolver fingerprints the merged body, so they agree only when the startup layer overrides every section; and a base section that the Brief marks out of scope still appears in the resolved downstream document because section merging can replace but not remove. The check names both instead of hiding them.
- Report-only is the first-cycle mode per the phase plan; enforcement is a separate decision.

## Downstream migration

None. The definition, command and tests are inherited through an ordinary merge and run in report mode; they read owned documents and change nothing. A child project gains a report and needs no adaptation of code, documents or configuration.
