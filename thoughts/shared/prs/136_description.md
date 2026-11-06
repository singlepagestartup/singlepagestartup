## Summary

The original PR changed only `apps/host/package.json`. Docker runs `npm ci`
from the repository root, which has no npm workspaces, so that change left the
runtime on the root lockfile's `qs@6.14.0`. This PR updates the installed
runtime dependency to `6.17.1` and aligns the Host manifest.

## Changes

- Pin `qs@6.17.1` in the root and Host manifests; update the root lockfile and
  its required `side-channel` and `side-channel-list` entries.
- Document which manifests control dependency installation.
- Add API-boundary tests for nested SDK filters, sorting, population,
  pagination, Unicode/reserved characters, JSON lists and prototype keys.

## Verification

- [x] `npx jest --config libs/shared/backend/api/jest.config.ts --runInBand --runTestsByPath libs/shared/backend/api/src/lib/middleware/parse-query/index.spec.ts` — 3 tests.
- [x] `npx jest --config apps/host/jest.config.ts --runInBand --runTestsByPath apps/host/app/api/email-generator/index.html/route.spec.tsx apps/host/app/api/telegram-generator/route.spec.tsx` — 14 tests.
- [x] `npx jest --config libs/shared/frontend/client/api/jest.config.ts --runInBand --runTestsByPath libs/shared/frontend/client/api/src/lib/consistency/index.spec.ts libs/shared/frontend/client/api/src/lib/factory/index.spec.ts libs/shared/frontend/client/api/src/lib/factory/queries-meta.spec.ts` — 15 tests.
- [x] Root `npm ci --dry-run --ignore-scripts --offline --no-audit --no-fund` accepts the manifest/lockfile pair.
- [x] Extracted the exact 19-package qs runtime subtree from the final root
      lockfile, installed it with `npm ci`, confirmed every installed version
      matches, and ran the tests against that tree. Other test dependencies use
      the existing checkout installation.
- [x] `npm audit --omit=dev` on that isolated locked qs subtree reports zero
      vulnerabilities. This is not an audit result for the entire repository.
- [x] Before/after probes show `6.17.1` enforces the comma-array limit and
      encodes empty-array keys that injected query parameters under `6.14.0`.
- [x] Formatting checks for changed manifests, lockfile and test; `git diff --check`.

## Notes

A full Docker/Next build was not run. The comma-array probe uses `comma: true`;
current shared query middleware uses default parsing, so the probe does not
establish that the deployed API exposed that particular vulnerability.

## Downstream migration

Projects with owned root/Host manifests or lockfiles retaining an older `qs`
release must align those declarations with `6.17.1` or a later compatible
patched version and regenerate the root npm lockfile. Install from the root,
confirm the resolved runtime version, and verify nested query parsing, SDK
serialization and Host generators.
