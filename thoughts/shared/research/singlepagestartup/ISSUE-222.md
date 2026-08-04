---
date: 2026-08-03T00:54:51+03:00
researcher: flakecode
git_commit: 036cdb033fbcb5597b90a5b502965034fdd98189
branch: main
repository: singlepagestartup
topic: "Current architecture for the AI-native client lifecycle, canonical agent knowledge, artifact inheritance, and Storybook Studio"
tags: [research, codebase, agents, artifacts, inheritance, storybook, digital-agency]
status: complete
last_updated: 2026-08-03
last_updated_by: flakecode
---

# Research: AI-native client lifecycle and unified artifact architecture

**Date**: 2026-08-03T00:54:51+03:00
**Researcher**: flakecode
**Git Commit**: 036cdb033fbcb5597b90a5b502965034fdd98189
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Document the repository as it exists before issue #222 is planned: the current
agent/workflow sources, durable knowledge and artifact paths, singlepage/startup
inheritance patterns, Drafts/Storybook catalog, legacy digital-agency process,
production surfaces, and existing QA/deployment capabilities.

The issue describes one future cohesive refactoring and client-delivery system.
This research distinguishes that requested target from mechanisms that are
already implemented. It does not define the implementation plan.

## Summary

The checkout currently contains four separate but related systems:

1. A GitHub-Project-gated engineering workflow. AGENTS.md is the universal
   entry point, .claude/commands and .claude/references are canonical, and
   .codex provides manually maintained wrappers and mirrored subagent
   definitions (AGENTS.md:53-116; .codex/README.md:1-37).
2. Durable engineering memory under thoughts/shared. Ticket, process, research,
   plan, and handoff files are repository-namespaced and phase-gated, with
   explicit lookup and write-back contracts
   (.claude/references/knowledge-first-contract.md:7-44;
   .claude/references/process-artifact-contract.md:18-120).
3. A presentation-only Storybook catalog under apps/drafts, supported by
   manifest discovery, inventory, validation, Figma metadata, and runnable
   prototype commands under tools/drafts (apps/drafts/README.md:3-10,61-76,
   90-176; tools/drafts/design-system/validate.ts:295-790).
4. A local five-stage marketing agency method under tools/digital-agency. It
   describes document handoffs through a /project directory, but that directory
   does not exist in this checkout and the method is not connected to the
   engineering workflow, Storybook, production implementation, or deployment
   (tools/digital-agency/agency_context.md:3-36;
   tools/digital-agency/agency_pipeline.md:1-320).

The requested .agents/, workspace/, apps/studio/, and .sps/ roots do not exist.
There is no implemented general artifact envelope, export policy, version/hash
locking, merge strategy, artifact resolver, or resolved/diff projection. The
current repository does already have narrower inheritance patterns: startup
backend services extend singlepage services, effective frontend variant maps
spread singlepage before startup, and the two Drafts startup overrides reuse
the same stable block ID and source tuple as their singlepage bases
(libs/modules/host/models/metadata/backend/app/api/src/lib/service/startup/index.ts:1-6;
libs/modules/host/models/page/frontend/component/src/lib/variants.ts:1-7;
apps/drafts/modules/website-builder/models/widget/startup/content-default/block.manifest.json:3-17).

QA and deployment are established repository capabilities. The scoped test
pipeline, manual browser role, implementation review gates, preview/production
workflows, deployer scripts, smoke checks, and rollback notes all exist. Issue
#222 therefore intersects them as production handoff boundaries rather than as
new process definitions (README.md:11-23,532-546;
.claude/commands/core/30-implement.md:201-227,277-313;
tools/deployer/README.md:150-189,266-297).

## Detailed Findings

### 1. Current repository topology

The live roots corresponding to issue #222 are:

| Concern                                           | Current source                              |
| ------------------------------------------------- | ------------------------------------------- |
| Universal agent entry                             | AGENTS.md                                   |
| Claude entry and canonical process implementation | CLAUDE.md and .claude/                      |
| Codex adapter                                     | .codex/                                     |
| Engineering artifacts                             | thoughts/shared/                            |
| Visual/catalog runtime                            | apps/drafts/                                |
| Draft tooling                                     | tools/drafts/                               |
| Legacy client/marketing method                    | tools/digital-agency/                       |
| Production runtime                                | apps/api, apps/host, apps/mcp, libs/modules |
| Testing                                           | package.json scripts and tools/testing/     |
| Deployment                                        | tools/deployer/ and .github/workflows/      |

The following issue-target roots are absent from the current checkout:

- .agents/
- workspace/
- .sps/
- apps/studio/
- tools/studio/
- project/

The issue's execution contract is already explicit even though implementation
has not started: this is one large change under issue #222, performed after the
research and plan review gates on one dedicated branch and delivered as one
cohesive PR. Its numbered dependency phases are internal checkpoints; the
branch must remain runnable and be exercised against the evolving founder-led
fixture after every checkpoint
(thoughts/shared/tickets/singlepagestartup/ISSUE-222.md:136-148).

The repository contains 26 Claude command documents, 19 Codex skill wrappers,
8 Claude agent definitions, 8 Codex agent definitions, 192 files under
thoughts/shared, 760 files under apps/drafts, 8 files under tools/drafts, and
40 files under tools/digital-agency.

### 2. Engineering workflow and provider adapters

AGENTS.md defines one provider-neutral, status-gated engineering workflow. Its
canonical sources are .claude/commands/\*_/_.md for phase behavior,
.claude/references/_.md for contracts, and .claude/helpers/_.sh for GitHub
Project operations (AGENTS.md:53-67). The 12-state control plane is:

Triage -> Spec Needed -> Research Needed -> Research in Progress ->
Research in Review -> Ready for Plan -> Plan in Progress -> Plan in Review ->
Ready for Dev -> In Dev -> Code Review -> Done (AGENTS.md:69-87).

The core phase documents are:

- .claude/commands/core/00-create.md
- .claude/commands/core/10-research.md
- .claude/commands/core/20-plan.md
- .claude/commands/core/30-implement.md
- .claude/commands/core/next.md

The dispatcher reads GitHub Project status and routes to the matching phase
(.claude/commands/core/next.md:24-81). Research, plan, and implementation each
have explicit entry states; chat history and local phase inference are not the
control plane (.claude/commands/core/10-research.md:28-42;
.claude/commands/core/20-plan.md:28-40;
.claude/commands/core/30-implement.md:28-42).

Repository identity is resolved from TARGET_REPO, GITHUB_REPOSITORY, origin,
GH_REPO, then GitHub CLI fallback. The same resolved short name is used for
artifact namespaces (.claude/references/repository-context-contract.md:5-39;
.claude/helpers/repo_context.sh:63-108). Status helpers match both issue number
and repository URL, not issue number alone
(.claude/helpers/get_issue_status.sh:20-49;
.claude/helpers/get_project_item_id.sh:21-48).

Codex documents itself as an adapter to that workflow. Core Codex skills read
the corresponding .claude command and preserve the same gates, artifacts,
comments, and helpers (.codex/README.md:9-22;
.codex/skills/core-10-research/SKILL.md:8-34). There is no checked-in generator
or drift validator for these wrappers or for the mirrored agent definitions;
current parity is governed by documentation.

### 3. Current duplication and documentation drift

The current canonical arrangement reduces process duplication by putting phase
semantics in .claude/commands, but parallel provider-facing files still exist:

- AGENTS.md and CLAUDE.md repeat repository rules and require shared sections to
  stay synchronized (AGENTS.md:1-35; CLAUDE.md:1-37).
- .claude/agents contains eight Markdown agent definitions and .codex/agents
  contains eight TOML definitions of matching responsibilities
  (.codex/README.md:30-37).
- Nineteen .codex/skills/SKILL.md files wrap a subset of the 26 canonical
  .claude command documents.
- tools/digital-agency/AGENTS.md, CLAUDE.md, and GEMINI.md have identical
  content after their provider-specific first heading. Each repeats the same
  identity, five-stage invocation protocol, file table, artifact table, and
  optimization cycle (tools/digital-agency/AGENTS.md:1-65;
  tools/digital-agency/CLAUDE.md:1-65;
  tools/digital-agency/GEMINI.md:1-65).

Three root documents also make overlapping entry-point claims: AGENTS.md calls
itself the universal entry, CLAUDE.md calls itself the Claude entry and points
to AGENTS.md, while AI_GUIDE.md calls itself the entry for any AI assistant
(AGENTS.md:1-3; CLAUDE.md:1-6; AI_GUIDE.md:1-3).

Shared rule text has already diverged. AGENTS.md contains the precise
repository-generate rule for Drizzle changes and the full provider-neutral
workflow contract, while CLAUDE.md contains a shorter migration checklist and
shorter workflow description (AGENTS.md:27-35,53-116,151-155;
CLAUDE.md:29-37,64-94). Environment documentation also differs:
AGENTS.md/CLAUDE.md require Node 24+ and npm 11+, while .claude/README.md still
states Node 20+ (.claude/README.md:238-241).

### 4. Durable engineering artifacts

The engineering workflow uses five durable artifact kinds:

| Kind             | Current path                              |
| ---------------- | ----------------------------------------- |
| Ticket           | thoughts/shared/tickets/REPO/ISSUE-N.md   |
| Process log      | thoughts/shared/processes/REPO/ISSUE-N.md |
| Research         | thoughts/shared/research/REPO/ISSUE-N.md  |
| Plan             | thoughts/shared/plans/REPO/ISSUE-N.md     |
| Handoff/progress | thoughts/shared/handoffs/REPO/...         |

AGENTS.md defines these as committed project memory (AGENTS.md:88-100).
The knowledge-first contract defines lookup order, live verification of reused
facts, and write-back duty
(.claude/references/knowledge-first-contract.md:7-66). The process contract
defines a stable Markdown structure for phase status, incidents, and reusable
learnings (.claude/references/process-artifact-contract.md:18-120).

The current thoughts/shared tree has 47 tickets, 38 process logs, 36 research
files, 32 plans, and 24 handoff files. It also contains prs and retrospectives.
These files are discoverable by paths and text search; there is no generated
cross-kind artifact index in the current workflow.

The current artifact contracts are issue-oriented Markdown conventions. They do
not define the issue-222 business envelope fields for stable artifact ID, layer,
version, evidence/provenance, export policy, base hash, or merge strategy. They
also do not resolve singlepage plus startup into resolved/diff representations.

### 5. Existing singlepage/startup inheritance

The codebase already uses singlepage/startup layering in several narrower
forms:

- Startup backend classes can inherit the singlepage implementation directly.
  For example, host metadata's startup Service extends the singlepage Service
  without redefining it
  (libs/modules/host/models/metadata/backend/app/api/src/lib/service/startup/index.ts:1-6).
- Effective frontend variant maps spread singlepage variants first and startup
  variants second, so a matching startup key takes precedence
  (libs/modules/host/models/page/frontend/component/src/lib/variants.ts:1-7).
- Startup SDK entrypoints re-export singlepage adapters. Contract tests name
  this behavior explicitly
  (libs/modules/host/sdk/client/src/lib/startup/contracts.spec.ts:44-52).
- Shared frontend component shells accept module SDK providers and concrete
  child renderers; module wrappers extend the parent prop interface and pin
  variants
  (libs/modules/startup/models/widget/frontend/component/src/lib/singlepage/default/index.tsx:1-24;
  libs/modules/startup/models/widget/frontend/component/src/lib/singlepage/default/interface.ts:1-11).
- Draft startup blocks retain the base stable block ID/source tuple. The
  website-builder content-default override and startup widget override wrap or
  compare their singlepage base instead of creating an unrelated catalog item
  (apps/drafts/modules/website-builder/models/widget/startup/content-default/Component.stories.tsx:3-34;
  apps/drafts/modules/startup/models/widget/startup/default/StartupWidgetStartup.tsx:1-18).

These are code/import and manifest conventions. The repository does not
currently express selective knowledge export, version locks, source commit
hashes, artifact merge policies, or upstream-sync conflict state for business
knowledge.

### 6. Drafts and Storybook

apps/drafts is the current fast-prototyping and design catalog. Its module tree
mirrors libs/modules by module, entity type, entity, and layer. Storybook only
loads module stories, while runnable drafts remain a separate standalone
prototype area (apps/drafts/README.md:3-25,61-76,125-143;
apps/drafts/.storybook/main.ts:4-20).

Live catalog baseline:

| Item                     | Count |
| ------------------------ | ----: |
| Story files              |   128 |
| Block manifests          |   104 |
| Page manifests           |    24 |
| Figma metadata files     |   128 |
| singlepage manifests     |   126 |
| startup manifests        |     2 |
| Model block manifests    |   103 |
| Relation block manifests |     1 |
| Runnable manifests       |     4 |

The generated inventory reports 16 modules, 156 entities, 1,836 production
variants, and 25 covered variants
(apps/drafts/inventory/modules.generated.json:2-10). Inventory generation scans
production variants and draft block manifests, then writes the generated JSON
(tools/drafts/design-system/inventory.ts:227-352). Validation checks the system
manifest, block/page file references, layer/state/source fields, duplicate IDs
per layer, page-to-block references, and Figma metadata parity
(tools/drafts/design-system/validate.ts:295-790).

The presentation boundary is explicit: no backend, apps/api, SDK, React Query,
or production-module imports; components are static-props-driven and use the
Drafts token runtime (apps/drafts/README.md:170-176). Path containment and
manifest/file relationships are checked by code, while import prohibitions are
documented rather than statically validated
(tools/drafts/design-system/validate.ts:509-537,640-668;
tools/drafts/dev.ts:387-399).

Storybook currently uses @storybook/react-vite, the module story glob, runtime
and foundations static directories, and no addons
(apps/drafts/.storybook/main.ts:4-20). preview.ts only defines control matchers;
there are no globalTypes or layer-toolbar settings
(apps/drafts/.storybook/preview.ts:5-13). No Storybook Docs addon, general
artifact resolver, resolved/diff story generation, or apps/studio path is
implemented.

Current validation was rerun during this research:

- npm run drafts:validate passed: 4 runnable manifests.
- npm run drafts:ds:validate passed.
- npm run drafts:storybook:build passed with Storybook 10.4.6 and wrote
  dist/drafts/storybook.
- The built dist/drafts/storybook/index.json contains 149 entries.

### 7. Legacy digital-agency process

tools/digital-agency describes a local agent system in which files are the
handoff medium and /project is the source of truth
(tools/digital-agency/README.md:1-16,92-101;
tools/digital-agency/agency_context.md:3-36). The documented sequence is:

| Stage                       | Role               | Output                          |
| --------------------------- | ------------------ | ------------------------------- |
| 01 Client intake            | Account manager    | project/client_brief.md         |
| 02 Marketing strategy       | Marketing director | project/marketing_strategy.md   |
| 03 Funnel-link testing plan | Project manager    | project/project_plan.md         |
| 04 Content architecture     | Content architect  | project/content_framework.md    |
| 05 Performance analysis     | Analyst            | project/performance_analysis.md |

The fifth stage cycles back to stages 02 and 04
(tools/digital-agency/agency_pipeline.md:295-451). The method's primary model is
the chain Reach -> Follow -> Sale; the strategy stage creates at least five such
channel chains, and the analysis stage measures and diagnoses them
(tools/digital-agency/agency_context.md:40-63;
tools/digital-agency/agency_pipeline.md:66-104,295-451).

The current method contains useful client facts, positioning, audience,
competitor, channel, content, visual-identity, offer, and metric templates.
The client brief asks about the future/current site and evidence such as cases,
reviews, licenses, and promises
(tools/digital-agency/templates/client_brief_template.md:15-271,371-426).
The content framework includes voice, tone, palette, typography, composition,
and creative concept
(tools/digital-agency/templates/content_framework_template.md:60-196).

The documented five-stage pipeline does not produce a separate evidence
register, business plan, operating/service process, experiment artifact, asset
provenance record, website page/build specification, Storybook projection,
production handoff, or publication record. Website design and development
appear as possible freelancer task categories inside the project-plan template,
not as agent-owned lifecycle stages
(tools/digital-agency/templates/project_plan_template.md:223-261).

The /project directory described by these documents is absent from this
checkout. No dispatcher, schema validator, run log, or GitHub/local state bridge
was found for the five-stage sequence.

### 8. Production capabilities related to the client lifecycle

The production monorepo already provides domain surfaces that can carry parts of
a delivered customer system:

- CRM defines forms, ordered steps/inputs, submitted requests, options, file
  attachments, and form widgets (libs/modules/crm/README.md:1-47).
- Analytic stores metric definitions/values and dashboard widgets
  (libs/modules/analytic/README.md:1-45).
- Host owns pages, layouts, metadata, widget containers, and links from host
  widgets to external module widgets (libs/modules/host/README.md:1-94).
- Website Builder owns structured content primitives and relations for reusable
  content blocks, CTAs, media, features, and sliders
  (libs/modules/website-builder/README.md:1-57).
- File Storage owns uploaded media/metadata and reusable file widgets
  (libs/modules/file-storage/README.md:1-37).
- Notification owns delivery records, templates, topics, and widgets
  (libs/modules/notification/README.md:1-40).
- Agent defines scheduled automation units and UI widgets
  (libs/modules/agent/README.md:1-37).

apps/mcp exposes project/module discovery, schema inspection, page preview, and
safe dry-run/apply/read-back content operations through the existing API/SDK
runtime (README.md:102-211). These production capabilities are not currently
orchestrated by tools/digital-agency into the five-stage /project workflow.

### 9. Existing QA and deployment boundaries

The root package exposes scoped unit, integration, scenario, issue-scenario, and
combined test scripts (package.json:26-35). The documented canonical automated
pipeline is unit + integration + DB-backed scenario; browser Playwright is not
part of that scoped command pipeline (README.md:11-23,532-546).

Manual/browser QA is a separate role. browser-tester covers authenticated route
behavior, screenshots, console/network checks, responsiveness, and regressions
(.claude/agents/browser-tester.md:2-84). Implementation also includes automated
verification and explicit manual verification pauses
(.claude/commands/core/30-implement.md:201-227,277-313). validate_plan provides
pre-implementation audit and post-implementation validation
(.claude/commands/validate_plan.md:5-145).

tools/deployer is an Ansible and Docker Swarm deployment subsystem
(tools/deployer/README.md:1-63). Its top-level up.sh composes server, AWS,
certificate, Traefik, Portainer, Postgres, Redis, LLM, API, MCP, Telegram, and
Host deployment scripts in dependency order (tools/deployer/up.sh:1-19).
GitHub workflows and deployer helpers already distinguish preview and production
release paths (.github/workflows/release.yml:1-77;
.github/workflows/ansible.yml:32-274). The deployer contains concrete public
certificate probes, replica waits, Portainer initialization checks, serialized
image pulls, rollout verification guidance, and rollback guidance
(tools/deployer/certbot/create_ssl_certificate.yaml:22-66;
tools/deployer/traefik/create_traefik.yaml:84-100;
tools/deployer/portainer/create_portainer_user.yaml:10-98;
tools/deployer/README.md:150-189,266-297).

tools/digital-agency has business experiment planning and performance analysis,
but no engineering QA or deployment stage. .codex/README.md also explicitly
states that its current adapter scope excludes digital-agency/deployer migration
(.codex/README.md:5-8).

### 10. Current architecture flow

The implemented flow is currently split rather than resolved through one
artifact protocol:

    GitHub Project status
             |
      .claude core commands <--- .codex skill wrappers
             |
      thoughts/shared issue artifacts

    tools/digital-agency
             |
      documented /project artifacts (directory absent)

    libs/modules variants ---> tools/drafts inventory/validation
                                      |
                               apps/drafts Storybook

    approved engineering plan ---> apps/api + apps/host + libs/modules
                                      |
                              existing tests/deployer

There is no current index or runtime edge that connects the /project business
documents to thoughts/shared, Storybook stories, a production build
specification, or deployment/measurement records.

## Verification

Commands executed during this research:

- npm run drafts:validate
- npm run drafts:ds:validate
- npm run drafts:storybook:build
- jq '.entries | length' dist/drafts/storybook/index.json
- targeted rg/rg --files counts for workflows, agents, artifacts, manifests,
  stories, layers, and missing issue-target roots
- git status --short after the Storybook build

Results:

- All three existing Drafts checks/builds passed.
- The Storybook build produced 149 index entries.
- The build did not add tracked changes; only the pre-existing issue #222
  ticket/process artifacts remained untracked before this research file was
  created.

## Code References

- AGENTS.md:53-116 - canonical provider-neutral engineering workflow.
- .claude/commands/core/next.md:24-81 - status dispatcher.
- .claude/references/knowledge-first-contract.md:7-66 - artifact lookup and
  write-back contract.
- .claude/references/process-artifact-contract.md:18-120 - process artifact
  structure and lifecycle.
- .claude/references/repository-context-contract.md:5-39 - repository identity
  and artifact namespace.
- .codex/README.md:1-37 - Codex adapter boundary.
- apps/drafts/.storybook/main.ts:4-20 - Storybook source and addon config.
- apps/drafts/.storybook/preview.ts:5-13 - current preview configuration.
- apps/drafts/system.manifest.json:2-24 - Drafts runtime/inventory roots.
- tools/drafts/design-system/inventory.ts:227-352 - generated coverage
  inventory.
- tools/drafts/design-system/validate.ts:295-790 - block/page/system
  validation.
- tools/digital-agency/agency_context.md:3-36 - local artifact sequence.
- tools/digital-agency/agency_pipeline.md:1-451 - five-stage agency pipeline.
- tools/digital-agency/templates/project_plan_template.md:223-261 - external
  design/development task categories.
- libs/modules/host/models/page/frontend/component/src/lib/variants.ts:1-7 -
  singlepage/startup precedence.
- package.json:26-35,43-51 - test and Drafts command surfaces.
- tools/deployer/README.md:1-63,150-189,266-297 - deployment, verification, and
  rollback surface.
- thoughts/shared/tickets/singlepagestartup/ISSUE-222.md:67-187 - requested
  target architecture, dependency sequence, and constraints.

## Architecture Documentation

Current engineering memory and current visual artifacts use different schemas:

- Engineering memory is issue-keyed Markdown with per-kind frontmatter and
  phase conventions.
- Draft visual artifacts use JSON manifests, stable block/page IDs, a layer,
  source tuple, file bindings, and paired Figma metadata.
- Runnable prototypes use a separate manifest schema with id, title, type,
  entry, scope, timestamps, and run configuration.
- Digital-agency documents use fixed filenames and Markdown templates under a
  documented /project root.
- Production data is represented by module models/relations and accessed
  through generated SDK/API surfaces.

The current reuse model is correspondingly split:

- workflow knowledge reuse is lookup-order plus repository namespacing;
- production code reuse is imports, class extension, wrapper components, and
  merged variant maps;
- Drafts reuse is shared IDs/source tuples plus startup wrappers;
- digital-agency reuse is sequential reading of fixed Markdown filenames.

## Historical Context (from thoughts/)

- The March DEVFLOW work consolidated an earlier fragmented command set into
  the current linear, GitHub-gated engineering workflow. Its scope was
  engineering research/plan/implementation, not a client business lifecycle
  (thoughts/shared/research/singlepagestartup/2026-03-02-DEVFLOW-linear-cycles-research.md:28-29,174-255;
  thoughts/shared/plans/singlepagestartup/2026-03-03-DEVFLOW-linear-cycles.md:37-97).
- Issue #201 established the current Storybook catalog boundary: reusable
  module blocks and host page recipes live under apps/drafts/modules, while
  runnable trees are source material or explicitly retained standalone
  prototypes. Its implementation completed the repository-side catalog
  migration (thoughts/shared/research/singlepagestartup/ISSUE-201.md:30-50,63-69;
  thoughts/shared/processes/singlepagestartup/ISSUE-201.md:43-56).
- Issue #203's final process update supersedes its earlier remote Figma
  implementation record: high-fidelity remote Figma creation is not an accepted
  Codex-owned path; accepted nodes are created/reviewed manually or with Figma
  Agents before metadata reconnection
  (thoughts/shared/processes/singlepagestartup/ISSUE-203.md:46-56,124-139).
- Issue #150 records the move away from active Playwright wiring toward scoped
  unit, integration, and scenario testing. Its closure trail is less complete
  than #201/#215 because the handoff header remains in progress
  (thoughts/shared/research/singlepagestartup/ISSUE-150.md:33-38,103-108,159-172;
  thoughts/shared/handoffs/singlepagestartup/ISSUE-150-progress.md:1-7,118-122).
- Issue #215 and the earlier #199 deployment work record the current
  infrastructure hardening, Swarm/Traefik boundary, shared overlay, public ACME
  proof, and simplified guarded rollout contract
  (thoughts/shared/processes/singlepagestartup/ISSUE-215.md:61-80,248-252;
  thoughts/shared/processes/singlepagestartup/ISSUE-199.md:1030-1041,1118-1125).

## Verified Facts

- Issue #222 is in its research phase; its target architecture has not been
  implemented.
- Issue #222 is one implementation issue, one dedicated branch, and one
  cohesive PR with dependency-ordered practical checkpoints; it is not an
  umbrella for child issues.
- .claude is the current canonical workflow source; .codex is a manually
  maintained adapter.
- .agents, workspace, .sps, apps/studio, and project roots are absent.
- thoughts/shared provides durable engineering memory but no unified generated
  artifact index/resolver.
- apps/drafts has a working, validated Storybook 10.4.6 build with 128 story
  files and 128 manifests.
- Current manifest layers are 126 singlepage and 2 startup.
- tools/digital-agency defines five business/marketing stages and fixed Markdown
  artifacts; it has no implemented local project instance in this checkout.
- The production modules required for pages, forms/leads, metrics, content,
  media, notifications, and scheduled automation already exist.
- Automated tests, manual browser QA, preview/production deployment, smoke
  checks, and rollback guidance already exist.

## Unverified Assumptions

- No founder-led client fixture was executed because the requested artifact
  engine and client workflow do not exist yet.
- No live preview or production deployment was performed during this research;
  deployment findings come from current scripts, workflow definitions, and
  prior deployment artifacts.
- The absence of an adapter generator, drift validator, artifact resolver, and
  resolved/diff implementation is based on targeted source/file searches, not
  an execution trace of a hidden external service.
- This research counted provider files and verified concrete drift examples; it
  did not perform semantic pairwise comparison of every command and agent line.

## Contradictions

- Root entry documentation conflicts over whether AGENTS.md or AI_GUIDE.md is
  the universal starting point.
- AGENTS.md and CLAUDE.md require shared content parity, but their migration
  guidance and workflow detail are not equal.
- Node prerequisites are 24+/npm 11+ in AGENTS.md and CLAUDE.md but 20+ in
  .claude/README.md.
- tools/digital-agency declares elimination of duplicated functions as an
  agency goal while maintaining three provider instruction files with identical
  bodies after the first heading
  (tools/digital-agency/agency_context.md:204-212,305-315).
- apps/drafts/README.md names a landing-page-basic example that is absent and
  depicts styles.css in block/page layouts even though current manifests do not
  reference CSS files; the validator treats CSS as optional
  (apps/drafts/README.md:54-55,91-98,135-140;
  tools/drafts/design-system/validate.ts:540-561).
- package.json exposes npm run test:file, while recent handoffs record that the
  helper fails before Jest unless a project-qualified Nx target is used
  (package.json:26;
  thoughts/shared/handoffs/singlepagestartup/ISSUE-193-progress.md:38-40;
  thoughts/shared/handoffs/singlepagestartup/ISSUE-189-progress.md:56-63).
- Issue #203's earlier implementation notes say remote Figma synchronization
  completed, but its later closure record explicitly rejects that Codex-owned
  result and supersedes it.

## Related Research

- thoughts/shared/research/singlepagestartup/2026-03-02-DEVFLOW-linear-cycles-research.md
- thoughts/shared/research/singlepagestartup/ISSUE-201.md
- thoughts/shared/research/singlepagestartup/ISSUE-203.md
- thoughts/shared/research/singlepagestartup/ISSUE-215.md
- thoughts/shared/research/singlepagestartup/ISSUE-150.md

## Open Questions

- The repository does not yet record the exact source-to-generated mapping from
  future .agents definitions to Claude and Codex adapter formats.
- The repository does not yet define the authoritative business artifact type
  catalog, dependency graph, evidence/provenance vocabulary, export boundary,
  or merge semantics.
- The repository does not yet encode review states and recovery semantics for
  the local client workflow.
- The migration mapping from each legacy digital-agency file and each
  thoughts/shared artifact kind to a shared index is not yet recorded.
- The current accepted boundary between Storybook projections, manually
  reviewed Figma assets, production variants, and build specifications has not
  been encoded as one machine-readable contract.
- The minimal founder-led client fixture and its concrete expected artifacts are
  described by success criteria but do not yet exist as executable repository
  data.

## Confidence

**Overall: high.**

- High confidence: live topology, file counts, workflow gates, artifact paths,
  Drafts counts/configuration, validation/build results, existing inheritance
  examples, digital-agency stages, and QA/deployment entrypoints.
- Medium-high confidence: absence of generator/resolver/drift validation and
  absence of a digital-agency execution bridge, because these are
  repository-search absence claims.
- Historical statements are explicitly separated from live-code findings; live
  code and current process records take precedence where older artifacts differ.

## Known Pitfalls (from implementation)

### GitHub API unavailable in the sandboxed preflight

- **Occurrences**: 2
- **Symptom**: Shared issue/status flows can resolve local repository and Project
  configuration but fail when they contact `api.github.com` from the default
  sandbox.
- **Root Cause**: The default shell sandbox has no GitHub API network access.
- **Fix**: Rerun the unchanged shared-helper command with approved network
  access; issue #222's resume occurrence then confirmed the required `In Dev`
  gate.
- **Reusable Pattern**: Preserve `.claude/helpers/*` as the status authority and
  escalate that exact helper call. Do not replace a failed gate with local state
  or an ad hoc GitHub command.
