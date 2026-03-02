# Startup E2E Area

This directory is reserved for customer-owned E2E scenarios.

## Ownership model

- `e2e/singlepage/*` is maintained by the framework team (SinglePage).
- `e2e/startup/*` is maintained by startup/client teams.

## Why this exists

The separation reduces merge conflicts when pulling updates from the upstream framework repository:

- framework updates are expected in `singlepage`
- customer business scenarios are expected in `startup`

As long as teams keep custom tests inside `startup` and do not modify `singlepage` files, upstream pulls stay low-conflict.

## Recommended structure

Create tests under a team namespace, for example:

- `e2e/startup/acme/*.e2e.ts`
- `e2e/startup/contoso/*.e2e.ts`

Use shared helpers from `e2e/support/*` where possible.

## Starter template

- `template.startup.e2e.ts` is intentionally `test.skip(...)`.
- Keep it as a reference and create your real tests in your own namespace directory.
