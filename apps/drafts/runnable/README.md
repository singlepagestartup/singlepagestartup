# Runnable Drafts

Runnable drafts are standalone imported prototypes. They are not the reusable
SPS design-system catalog. Reusable presentation belongs in Storybook under
`apps/drafts/modules/<module>/<models|relations>/<entity>/<layer>/<block-id>`.

For issue `201`, runnable sources are treated as source material until every
meaningful component/page/layout/context/editor source is classified in
`../inventory/runnable-migration.md` as `migrated`, `replaced`, or `retained`.

No Figma transfer, sync, creation, or remote update is part of the current
runnable-to-Storybook work. Figma starts only after Storybook review and explicit
approval.

## Retention Contract

A runnable entry may remain after the migration only when all of these are true:

- Its reusable SPS UI has already been migrated to Storybook or replaced by
  existing module-owned Storybook drafts.
- The entry still serves a standalone runnable purpose that Storybook should not
  own.
- The reason is recorded in the migration matrix.
- `npm run drafts:validate` continues to pass.

## Current Entries

| Entry                                  | Current role                                                                                          | Storybook status                                                     | Matrix row                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `singlepage/admin-v2`                  | React/Vite source material for public and admin Storybook migration                                   | `migrated` / `replaced` by component rows                            | [`RUN-SP-ADMIN-V2`](../inventory/runnable-migration.md#run-sp-admin-v2)       |
| `startup/singlepagestartup`            | Startup React/Vite source material; source tree mirrors `singlepage/admin-v2` except wrapper metadata | `migrated` startup widget discoverability / `replaced` mirrored base | [`RUN-ST-STARTUP`](../inventory/runnable-migration.md#run-st-startup)         |
| `singlepage/admin-panel-redesign-html` | Static admin-panel redesign reference                                                                 | `migrated` into admin Storybook coverage                             | [`RUN-HTML-ADMIN-REF`](../inventory/runnable-migration.md#run-html-admin-ref) |
| `singlepage/examples/basic-html`       | Minimal runnable-system HTML smoke example                                                            | `retained` as standalone example                                     | [`RUN-BASIC-HTML`](../inventory/runnable-migration.md#run-basic-html)         |

## Retained Entries

### `singlepage/examples/basic-html`

Retained by [`RUN-BASIC-HTML`](../inventory/runnable-migration.md#run-basic-html).
This entry validates the simplest standalone runnable path and does not
represent reusable SPS UI.

## Migrated Source-Material Entries

The following entries remain in `runnable` only as imported source material and
traceability references. Storybook is now the review surface for reusable pages,
models, widgets, and admin-v2 states:

- `singlepage/admin-v2`
- `startup/singlepagestartup`
- `singlepage/admin-panel-redesign-html`

They should not be treated as the lasting source of truth for reusable SPS UI.
After Storybook coverage is reviewed, each entry can be removed/trimmed in a
separate cleanup if the project no longer needs the original imported prototype.
