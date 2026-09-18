# Migrations

A migration is a dated, one-time procedure for a legacy workspace shape that a
synchronized checkout may still carry. Procedures live in this directory as
`<YYYY-MM-DD>-<shape>.md`, are named by `legacy_shapes[].procedure` in
`.agents/pipeline/pre-development.yaml`, and are loaded only when
`npm run singlepagestartup:pipeline:check` reports that shape. The permanent
contracts, roles, templates and the workflow describe the current shape only.

## Retired procedures

On 2026-09-18 every known live workspace was inspected: the framework layer and
the only downstream project with a Studio workspace carried none of the shapes
below, so their procedures were removed instead of moved. The detectors stay in
the pipeline definition. When one reports a shape, read the former procedure
from Git history with the command beside the table, apply it once in the owning
layer, and remove the shape; a structural move never renews confirmation,
relocation is not fresh verification, and unique client facts, source IDs and
approvals survive.

```bash
git show 80bf5cdb1483a2427c6566eebab1173667d8050f:.agents/contracts/pipeline-reconciliation.md
```

| Legacy shape              | Detector                                                                                                                                           | Former procedure section                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `decision-profile`        | `knowledge/decision-profile/<layer>.md` exists                                                                                                     | Retiring the former Decision Profile                                    |
| `standalone-business`     | `business/<layer>.md` exists or the index has an entry of kind `business`                                                                          | Retiring standalone Business; also `tools/studio/products/MIGRATION.md` |
| `catalog-v1`              | a catalog declares `singlepagestartup.product-catalog.v1`                                                                                          | Retiring standalone Business                                            |
| `sales-v1`                | a product Sales file declares `singlepagestartup.sales-process.v1`                                                                                 | Sales segment compatibility                                             |
| `evidence-register-codes` | `ST-EV-*` or `SP-EV-*` codes in workspace Markdown or YAML                                                                                         | Layer and inheritance rules, Evidence register paragraphs               |
| `legacy-cursor-anchors`   | cursor blockers on `#decision-status`, `#commercial-choice` or `#first-experiment`, or active artifacts `business`, `decision-profile`, `evidence` | Compact Strategy migration                                              |

Three procedures had no detector and were retired at the same time because the
current templates and Studio surfaces define their target shape: Compact Brief
migration, Compact Brand migration and Material workspace compatibility. They
are in the same historical file.

How a downstream project adapts to shared changes is governed by
`.agents/contracts/engineering/downstream-migrations.md` and
`tools/upstream/migrations.mjs`, not by this directory.
