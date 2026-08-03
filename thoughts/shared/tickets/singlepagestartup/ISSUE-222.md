---
repository: singlepagestartup
issue_number: 222
status: Research Needed
created: 2026-08-02
---

# Issue: Build the AI-native client lifecycle from first meeting to customer-acquisition website

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/222
**Status**: Research Needed
**Created**: 2026-08-02
**Priority**: high
**Size**: large
**Type**: feature

---

## Problem to Solve

SinglePageStartup accelerates website development, but its typical client needs
more than implementation. The client often arrives with an informal business
plan, customers from word of mouth and one marketplace listing, a few photos,
and only the founder's name and phone number as a brand. Building a website from
that input without clarifying the commercial model, customer, offer, evidence,
sales process, and measurement plan produces code without a clear business role.

Build an AI-native client lifecycle that takes a customer from the first call or
meeting to a measurable, published website. The agent system must develop the
business plan, positioning, brand, marketing strategy, content, design, and
build specification from evidence. The website is not the terminal deliverable:
it is one stage in the customer's acquisition, qualification, sales,
fulfillment, and retention process.

## Discussion Summary

- SPS should turn a loosely described founder-led business into a clear
  commercial hypothesis, operational process, Brand v0.x, marketing/content
  system, production website, lead-delivery path, analytics, and first market
  experiment.
- Intake must separate verified facts, customer claims, assumptions, unknowns,
  constraints, available evidence, and missing evidence. Generated assets must
  carry provenance and must not be presented as customer work or proof.
- The workflow runs through intake, research, business strategy, operations,
  experiment design, brand, assets, content, Storybook design projections, build
  specification, production implementation, publication through existing
  deployment, and measurement with a `scale | iterate | pivot | stop` decision.
- A website is incomplete when it only submits a form. The system must define
  where the lead goes, who owns it, the response SLA, qualification criteria,
  follow-up, proposal, fulfillment, recovery path, and funnel events.
- `singlepage` is the reusable SPS base, `startup` is a concrete client overlay,
  `resolved` is the effective result, and `diff` shows the overlay. Client
  projects inherit only exported methods and production contracts, never SPS or
  another customer's strategy, brand, evidence, assets, or private data.
- `apps/drafts` should evolve into a Storybook-based `apps/studio` while
  preserving presentation-only components, stable IDs, manifests, inventory,
  Figma metadata, and the existing `singlepage`/`startup` projection model.
- Business/product artifacts and issue-based engineering artifacts should be
  searchable and visible through one artifact index while retaining separate
  lifecycle state machines.
- Existing tests, browser QA, preview/production deployment, infrastructure,
  smoke checks, and rollback mechanisms are existing capabilities to integrate,
  not new systems to rebuild.

## Target Architecture

The refactoring is based on one canonical definition with several generated or
read-only projections:

```text
.agents/                  canonical workflows, skills, roles, knowledge,
                          contracts, schemas, templates, and validators

.claude/ + .codex/        generated provider adapters only

workspace/                canonical business and product artifacts:
  singlepage/             exported SPS methods and reusable contracts
  startup/                client-specific evidence, strategy, brand, content,
                          design, engineering decisions, and results

apps/studio/              the single Storybook runtime for documents, visual
                          projections, review, resolved views, and diffs

.sps/                     generated indexes, resolved artifacts, cache, runs,
                          and disposable runtime state

apps/host + apps/api
+ libs/                   the production system delivered to the client
```

Studio projections stay presentation-only and static-props-driven. Canonical
artifacts stay independent from the React viewer, while generated Storybook
stories read the resolved artifact index. Provider adapters, resolved views,
indexes, and stories are generated; they are not parallel sources of business
process definitions.

## Mandatory Refactoring Sequence

The initiative must proceed incrementally in this dependency order:

0. **Baseline and migration inventory** — record current Storybook stories,
   manifests, validators, npm/Nx commands, agent definitions, `thoughts/shared`,
   `tools/digital-agency`, and existing QA/deployment surfaces.
1. **Canonical agent kernel** — introduce the provider-neutral source for
   workflows, skills, roles, knowledge, contracts, schemas, templates, and
   validators; generate Claude/Codex adapters and add drift validation.
2. **Drafts to Studio** — rename `apps/drafts`, `tools/drafts`, package identity,
   commands, outputs, inventory paths, documentation, and metadata while
   preserving every working story and manifest; add Storybook Docs and the layer
   toolbar without creating another runtime.
3. **Artifact engine and inheritance** — implement discovery, schemas, stable
   IDs, export policies, version/hash locking, merge strategies, resolution,
   validation, index generation, and `singlepage | startup | resolved | diff`.
4. **Local client workflow** — add file-backed client state, review gates, run
   logs, dispatcher/status commands, and recovery without weakening the existing
   GitHub-gated engineering workflow.
5. **Legacy knowledge integration** — index current `thoughts/shared`; migrate
   useful `tools/digital-agency` methods, roles, channel knowledge, and templates
   into canonical definitions; retain compatibility until link and parity checks
   pass.
6. **Business foundation pipeline** — implement intake, evidence, business/
   customer/market research, commercial strategy, operations, and experiment
   design for the minimal founder-led client fixture.
7. **Brand-to-build pipeline** — implement Brand v0.x, provenance-aware assets,
   marketing/content strategy, page specifications, Studio design projections,
   and the approved build specification.
8. **Production handoff and measurement** — connect the build specification to
   SPS production implementation, reuse the existing QA/deployment path, and
   record experiment results and the next iteration decision.
9. **Legacy removal** — remove old names, adapters, workflow entry points, and
   artifact locations only after functional parity, link validation, and a full
   client fixture pass.

## Execution Strategy

This is one large implementation under issue #222, not an umbrella that will be
split into child issues. After the research and plan review gates, all phases are
implemented in dependency order on one dedicated issue branch and delivered as
one cohesive change/PR.

The internal phases remain explicit checkpoints rather than separate issues.
After every checkpoint, the branch must be runnable and validated against the
current repository plus the evolving founder-led client fixture. Failures are
fixed before continuing, so architecture decisions are tested in practice while
the system is being rebuilt instead of only at the end. The final review covers
the complete end-to-end migration and fixture.

## Scope

1. Define the target agent, workflow, knowledge, artifact, inheritance, and
   Studio architecture.
2. Establish one canonical source for workflows, skills, roles, schemas,
   validators, templates, and reusable knowledge; generate thin Claude/Codex
   adapters and validate their parity.
3. Define a stable artifact envelope with IDs, types, layers, versions, status,
   evidence/provenance, export policy, base hashes, and explicit merge strategy.
4. Support selective, version-locked inheritance of exported SPS knowledge by
   child repositories while preserving their startup layer during upstream sync.
5. Add an artifact index/resolver that can initially read new business artifacts,
   current `thoughts/shared` engineering artifacts, and legacy
   `tools/digital-agency` material without a destructive migration.
6. Design the client workflow from intake through research, business strategy,
   operations, experiment, brand, content, design, build specification,
   production handoff, and measurement.
7. Evolve Drafts into a single-runtime Storybook Studio showing documents and
   visual projections in `singlepage | startup | resolved | diff` modes.
8. Produce one dependency-ordered implementation plan for issue #222 and execute
   it on one dedicated branch, validating the working system after every internal
   checkpoint before legacy paths are removed.

## Architecture Constraints

- Workflow definitions own order, state, dependencies, and review gates. Skills
  own execution methodology; schemas own artifact shape; templates own document
  skeletons. The same business process must not be repeated across them.
- Artifact resolution, validation, inheritance, and diff must work headlessly in
  CLI/CI. Storybook displays the result but does not own merge semantics.
- Preserve the current GitHub-Project-gated engineering workflow while adding a
  separate local client workflow over the shared artifact protocol.
- Do not delete or bulk-move `thoughts/shared` until indexing, migration mapping,
  link validation, and functional parity exist.
- Migrate `tools/digital-agency` only after the new canonical contracts represent
  its useful methodology without duplication.
- Reuse the current QA and deployment implementations; this issue does not
  authorize replacements for them.

## Success Criteria

- A minimally documented founder-led business can produce evidence-aware intake,
  research, business plan, positioning, operations, experiment, Brand v0.x,
  marketing/content strategy, design, build specification, and implementation
  artifacts.
- Public claims trace to evidence or are explicitly marked as promises, plans,
  assumptions, or unknowns; generated assets have provenance and usage limits.
- Client projects selectively inherit exported SPS knowledge while their own
  strategy, brand, data, content, and overrides survive upstream synchronization.
- Studio shows documents and visual projections through one Storybook runtime in
  `singlepage | startup | resolved | diff` modes.
- The build specification links business goals, experiment, content, Studio
  projections, production variants, models, integrations, and acceptance
  criteria.
- The published website connects to a defined lead/service process and emits the
  events required by the measurement plan.
- Existing QA and deployment remain the execution path and are not duplicated.
- Legacy systems are removed only after artifact/link validation and functional
  parity pass.
