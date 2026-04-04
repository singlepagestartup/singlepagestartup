# Replace Playwright E2E with Module-Wide Unit+Integration Test Matrix Implementation Plan

## Overview

Replace the current Playwright E2E lane with a stable, module-wide unit+integration matrix that covers all 15 SPS modules and keeps scoped validation fully automated without browser-driven flake.

## Current State Analysis

Playwright is still a first-class lane in scoped testing and remains wired through root scripts, Host Nx targets/configuration, Host e2e source trees, lint/type settings, bootstrap scripts, and documentation. At the same time, integration coverage is limited to `api` and `@sps/ecommerce`, and unit scoped coverage is limited to a fixed subset of projects.

## Desired End State

The repository runs a two-lane scoped test matrix (`unit + integration`) only, with:

- no active Playwright artifacts in runtime project configuration,
- module-level integration baseline coverage for all 15 modules,
- module-level initial unit contract coverage for all 15 modules using BDD format,
- `npm run test:all:scoped` chaining only `test:unit:scoped` and `test:integration:scoped`.

### Key Discoveries:

- E2E is still in the scoped pipeline chain (`package.json:21`, `package.json:26`, `package.json:27`).
- Host retains a dedicated Playwright target and config (`apps/host/project.json:45`, `apps/host/project.json:49`, `apps/host/playwright.config.ts:21`).
- Host spec TypeScript and lint config are coupled to Playwright files (`apps/host/tsconfig.spec.json:4`, `apps/host/eslint.config.mjs:10`, `apps/host/eslint.config.mjs:42`).
- Bootstrap still installs Chromium (`up.sh:8`).
- Integration targets currently exist only for `api` and `@sps/ecommerce` (`apps/api/project.json:164`, `libs/modules/ecommerce/project.json:9`, `package.json:20`).
- Module baseline is broad but under-tested: 15 modules, 146 backend `configuration.ts`, and only 17 module test files concentrated in ecommerce/rbac (`thoughts/shared/research/singlepagestartup/ISSUE-150.md:75`, `thoughts/shared/research/singlepagestartup/ISSUE-150.md:76`, `thoughts/shared/research/singlepagestartup/ISSUE-150.md:77`).
- Existing contract-style patterns are reusable for expansion: API/module integration source-inspection specs and configuration/SDK contract unit specs (`apps/api/specs/integration/ecommerce-mounting.integration.spec.ts:1`, `libs/modules/ecommerce/backend/app/api/src/lib/apps.integration.spec.ts:1`, `libs/modules/ecommerce/models/product/backend/app/api/src/lib/configuration.spec.ts:1`, `libs/modules/ecommerce/models/product/sdk/client/src/lib/startup/index.spec.ts:1`).

## What We're NOT Doing

- Reintroducing any browser E2E lane (Playwright or alternative) in this issue.
- Expanding from baseline contracts into deep per-entity behavioral suites for all 146 configurations (follow-up issues if needed).
- Changing business/runtime behavior of module APIs beyond what is needed for testability and contract assertions.
- Reworking historical `thoughts/shared/*` artifacts; only active docs/scripts/configs are aligned.

## Implementation Approach

Use a phased replacement strategy: first remove all active Playwright wiring, then expand integration targets/specs across all modules, then expand unit contract baselines across all modules, and finally align root scripts/docs/governance so scoped validation is unambiguous and enforceable.

## Phase 1: Decommission Active Playwright E2E Infrastructure

### Overview

Eliminate all runtime E2E execution paths and Playwright-specific toolchain dependencies from active project configuration.

### Changes Required:

#### 1. Root test scripts and dependencies

**File**: `package.json`  
**Why**: Root scripts currently route scoped testing through Playwright and declare Playwright-specific dev dependencies.  
**Changes**: Remove `test:e2e:*` scripts, remove `test:e2e:scoped`, update `test:all:scoped` to stop calling E2E, and remove Playwright-specific dependencies/plugins from active dependency graph.

#### 2. Host Nx target/config coupling

**File**: `apps/host/project.json`  
**Why**: `host:e2e` target is a direct entrypoint to Playwright execution.  
**Changes**: Remove the `e2e` target and any now-obsolete outputs/options tied to Playwright.

**File**: `apps/host/playwright.config.ts`  
**Why**: This file is the Playwright runner contract and webserver mode switch (`PW_USE_WEBSERVER`/`PW_SKIP_WEBSERVER`).  
**Changes**: Remove Playwright config from active Host app configuration.

#### 3. Host lint/type coupling cleanup

**File**: `apps/host/tsconfig.spec.json`  
**Why**: It currently imports Playwright types and includes only E2E paths.  
**Changes**: Remove Playwright-specific typing/include wiring; either repurpose for remaining Host spec scope or remove if obsolete.

**File**: `apps/host/eslint.config.mjs`  
**Why**: It has a dedicated E2E/playwright lint block and exclusions that become stale after removal.  
**Changes**: Remove E2E/playwright-specific lint block/ignores and normalize Host lint scope.

#### 4. Remove Host E2E source tree

**File**: `apps/host/e2e/**`  
**Why**: Active E2E test suites/mocks are Playwright-only and no longer in target architecture.  
**Changes**: Remove singlepage/startup E2E specs, support mock utilities, and E2E-specific docs/templates.

#### 5. Bootstrap and active docs cleanup

**File**: `up.sh`  
**Why**: It installs Playwright Chromium even though E2E is being retired.  
**Changes**: Remove Playwright browser install step.

**File**: `README.md`  
**Why**: Root execution docs currently advertise E2E scripts.  
**Changes**: Replace E2E lane guidance with unit+integration-only scoped workflow.

**File**: `apps/host/README.md`  
**Why**: Host docs describe Playwright ownership, commands, and webserver flags.  
**Changes**: Remove or rewrite E2E-specific sections to reflect the new test model.

### Success Criteria:

#### Automated Verification:

- [x] `npm run lint` passes.
- [x] `npm run test:unit:scoped` runs without E2E references.
- [x] `npm run test:integration:scoped` runs without E2E references.
- [x] `npm run test:all:scoped` no longer invokes `test:e2e:*`.
- [x] Targeted search in active runtime files (`package.json`, `apps/host/*`, `up.sh`, root/host README files) returns no active Playwright execution wiring.

#### Manual Verification:

- [x] Repository no longer exposes a runnable `host:e2e` path.
- [x] Developer onboarding steps no longer include browser/E2E bootstrapping.

---

## Phase 2: Build Module-Wide Integration Baseline

### Overview

Promote integration from a 2-project lane to a 15-module baseline with consistent Nx targets/configs and module contract checks.

### Changes Required:

#### 1. Add integration targets across all modules

**File**: `libs/modules/*/project.json`  
**Why**: Most modules currently have no `jest:integration` target and are excluded from scoped integration by design.  
**Changes**: Add/standardize `jest:integration` target definitions for every module, preserving existing conventions used by ecommerce (`executor`, `outputs`, `inputs`, `passWithNoTests` policy where needed).

#### 2. Add integration Jest config per module

**File**: `libs/modules/<module>/jest.integration.config.ts`  
**Why**: Integration lane requires explicit config because there is no workspace default for `jest:integration`.  
**Changes**: Introduce consistent integration config naming/patterns per module and align test match conventions to integration suffixes.

#### 3. Add baseline module integration contracts

**File**: `libs/modules/<module>/backend/app/api/src/lib/apps.integration.spec.ts` (or module-equivalent integration contract location)  
**Why**: Existing reusable pattern validates route registry consistency, type mapping, and uniqueness without brittle UI dependencies.  
**Changes**: Add BDD-formatted baseline integration specs for each module, reusing source-inspection contract style already present in API/ecommerce integration tests.

#### 4. Expand scoped integration orchestration

**File**: `package.json`  
**Why**: `test:integration:scoped` currently includes only `api,@sps/ecommerce`.  
**Changes**: Update scoped integration project list to include all module projects required by issue scope.

### Success Criteria:

#### Automated Verification:

- [x] `npm run test:integration:scoped` passes with all 15 modules included in scope.
- [x] Every module reports an available `jest:integration` target.
- [x] New integration specs conform to repository BDD header format requirements.

#### Manual Verification:

- [x] Spot-check selected modules outside ecommerce/rbac to confirm integration lane now executes module contract assertions.

---

## Phase 3: Build Module-Wide Unit Contract Baseline

### Overview

Establish initial, repeatable BDD unit contracts for all modules, prioritizing configuration and SDK contract surfaces.

### Changes Required:

#### 1. Ensure unit target availability across modules

**File**: `libs/modules/*/project.json`  
**Why**: Many modules currently lack `jest:test` target presence, preventing scoped unit lane expansion.  
**Changes**: Add/standardize unit target definitions where missing, aligned with existing workspace `jest:test` defaults.

#### 2. Add baseline backend configuration contracts per module

**File**: `libs/modules/<module>/**/configuration.spec.ts` (or module baseline contract spec location that covers configuration contracts)  
**Why**: Existing configuration specs in ecommerce provide a working pattern for seed metadata/filter/transform contract validation.  
**Changes**: Add initial BDD configuration contract coverage for each module’s backend configuration surfaces.

#### 3. Add baseline SDK contract assertions where applicable

**File**: `libs/modules/<module>/**/sdk/**/startup/*.spec.ts` (or equivalent client/server contract spec path)  
**Why**: Existing ecommerce startup SDK tests prove a low-cost parity contract pattern for exported APIs/providers.  
**Changes**: Add minimal BDD SDK contract checks in modules with startup/singlepage SDK surfaces.

#### 4. Expand scoped unit orchestration

**File**: `package.json`  
**Why**: `test:unit:scoped` currently enumerates only `api`, ecommerce, and shared frontend libs.  
**Changes**: Include all module projects in scoped unit lane while preserving shared/frontend unit coverage.

### Success Criteria:

#### Automated Verification:

- [x] `npm run test:unit:scoped` passes with all module projects in scope.
- [x] Every module has at least initial BDD unit contract coverage committed in module-owned test files.
- [x] Unit/integration split remains clean (integration specs excluded from unit lane where applicable).

#### Manual Verification:

- [x] Spot-check at least one newly covered module that previously had zero unit tests to confirm meaningful contract assertions (not placeholders).

---

## Phase 4: Finalize Scoped Pipeline and Supersession Governance

### Overview

Lock in the new testing model operationally (scripts/docs/status references) and make supersession intent explicit.

### Changes Required:

#### 1. Final scoped pipeline alignment

**File**: `package.json`  
**Why**: `test:all:scoped` is the main pipeline signal and must represent the final architecture.  
**Changes**: Ensure `test:all:scoped` is strictly `unit + integration` and remains the canonical scoped command.

#### 2. Documentation and workflow alignment

**File**: `README.md`, `apps/host/README.md`  
**Why**: Contributors rely on these docs for workflow expectations and command selection.  
**Changes**: Remove E2E references from active guidance, document new baseline lanes, and clarify module-wide coverage expectations.

#### 3. Superseded direction traceability

**File**: GitHub issue workflow artifacts for `#150` (and cross-reference to `#147` where applicable)  
**Why**: Acceptance criteria require superseded direction to be explicit and auditable.  
**Changes**: Ensure issue discussion/status notes clearly state that the #147 Playwright-first direction is superseded by #150’s unit+integration strategy.

### Success Criteria:

#### Automated Verification:

- [x] `npm run test:all:scoped` passes and executes only unit+integration lanes.
- [x] No active CI/local script path references E2E/Playwright for scoped validation.

#### Manual Verification:

- [x] Maintainers can follow docs/scripts without ambiguity about lane ownership.
- [x] Superseded relationship (#147 -> #150 direction) is visible in issue context.

---

## Testing Strategy

### Unit Tests:

- Add module-owned BDD contract tests for backend configuration behavior (seed metadata, filter/transform contracts).
- Add module-owned BDD SDK/export parity tests where startup/singlepage adapters exist.
- Reject placeholder assertions; baseline tests must validate real contracts.

### Integration Tests:

- Add module integration contract tests for route registry/type consistency and mount assumptions.
- Keep integration tests deterministic and backend-aligned (source/contract based), avoiding UI/browser dependencies.
- Ensure every module participates in `test:integration:scoped`.

### Manual Testing Steps:

1. Run `npm run test:unit:scoped`.
2. Run `npm run test:integration:scoped`.
3. Run `npm run test:all:scoped` and verify it completes without invoking E2E.
4. Spot-check docs (`README.md`, `apps/host/README.md`) to confirm no active Playwright workflow remains.
5. Spot-check at least two newly covered modules (outside ecommerce/rbac) for meaningful BDD contract tests.

## Performance Considerations

- Removing browser E2E should reduce local/CI flake and remove webserver/browser startup overhead.
- Expanding module integration/unit baselines increases Jest workload; keep Nx parallelism tuned and lane separation intact to preserve feedback speed.
- Contract-style tests should remain lightweight to avoid replacing E2E flake with heavy integration runtime.

## Migration Notes

- This is a test-infrastructure and verification-model migration, not a runtime data/schema migration.
- CI and local workflows must be updated in lockstep with script changes so no pipeline still expects Playwright artifacts.
- Historical planning/research files may still mention E2E for chronology; active docs and runnable scripts are the source of truth post-migration.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-150.md`
- Prior context (superseded direction): `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md`
