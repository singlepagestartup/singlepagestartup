---
repository: singlepagestartup
issue_number: 222
status: Code Review
created: 2026-08-02
---

# Issue: Build the AI-native client lifecycle from first meeting to customer-acquisition website

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/222
**Status**: Code Review
**Created**: 2026-08-02
**Priority**: high
**Size**: large
**Type**: feature

## Problem

SinglePageStartup clients usually arrive before they have a formal business or
brand system: a rough founder description, customers from word of mouth or one
listing, a few materials, and little more than a name and phone number. Starting
website development from that input produces design and code without a reliable
commercial foundation.

Build a compact AI-agent system that turns that starting point into an
evidence-aware business definition, market understanding, commercial strategy,
communication system, brand direction, and concrete website design ready for
the existing engineering workflow.

This issue ends before production development. Engineering process, testing,
analytics, deployment, and runtime integrations remain unchanged and out of
scope.

## Result

The system maintains eight living project artifacts:

- `brief` — founder request, language, constraints, goals, known facts, and
  unknowns;
- `evidence` — sourced facts, client claims, assumptions, promises,
  constraints, missing proof, scope, and state;
- `business` — business model, economics, capacity, and the complete operating
  chain from acquisition through delivery and follow-up;
- `research` — audience, buying situations, market, competitors, alternatives,
  sources, and explicit inferences;
- `strategy` — positioning, offer, commercial focus, acquisition choice, and
  one bounded first experiment;
- `brand` — message hierarchy, claims, objections, voice, identity direction,
  design tokens, typography, imagery, and components;
- `website` — visitor journey, page structure, final copy, form, success state,
  post-conversion action, metadata, and links to Studio compositions;
- `assets` — a provenance- and rights-aware asset registry.

The final artifact shapes stay compact and universal. A project-specific
decision profile classifies the actual business model and selects only material
questions, metrics, evidence, risks, regulations, and viability gates for the
current niche, so a structurally complete but generic answer cannot pass.

## Workflow

One `singlepagestartup` entry point starts, resumes, inspects, or changes the
project. Separate commands for roles, stages, and document editing are not
required.

The durable process has four stages:

1. `00-understand` — brief, evidence, decision profile, business, and research;
2. `10-decide` — positioning, offer, commercial model, acquisition focus, and
   first experiment;
3. `20-package` — communication, identity, and registered assets;
4. `30-design` — concrete website content, visitor/conversion flow, and static
   Storybook compositions.

A minimal cursor stores only current stage, status, active artifacts, and
blockers. Each new model context reconciles it from the living artifacts. Git is
the history; there is no run journal, recovery cache, business-document
versioning subsystem, or separate runtime state directory.

The seven executable specialist roles are Account Manager, Business Analyst,
Market Researcher, Strategist, Communication Strategist, Brand Designer, and Web
Designer. Each owns a bounded artifact or section, loads only relevant
dependencies and capabilities, and updates the canonical source rather than
returning disposable chat prose.

## Architecture

- `.agents/**` is the provider-neutral source for invariant workflows, role
  methods, contracts, templates, and capability descriptions. Claude and Codex
  keep thin native discovery adapters.
- All variable business knowledge and artifacts live under
  `apps/studio/workspace/**`. Engineering research and plans remain only in
  `thoughts/shared/**`.
- The workspace is artifact-first. Each final artifact or knowledge folder holds
  sibling `singlepage` and `startup` sources plus its Storybook projection.
  Storybook shows `current`, `singlepage`, and `startup` without generated JSON
  copies of the business data.
- `apps/studio/workspace/config.yaml` defaults to `startup`, so downstream users
  need no environment setup. The canonical
  `singlepagestartup/singlepagestartup` repository is mapped to `singlepage`; an
  optional gitignored local config may override the active layer.
- The two indexes live under `apps/studio/workspace/index/`. Every startup
  artifact explicitly names its `extends` target and merge strategy.
- Compatible Markdown documents merge by section; assets merge by stable ID;
  evidence merges by stable ID with scope/state rules; niche-specific decision,
  discovery, acquisition, and communication knowledge uses whole-document
  replacement once startup content exists.
- Empty startup sources pass the SinglePageStartup source through to `current`.
  A populated startup source overrides only according to its declared strategy.
  Inherited SinglePageStartup evidence remains provenance only and cannot support
  claims about a downstream business until explicitly adopted, replaced, or
  rejected in startup evidence.

## Implementation sequence

This remains one large branch and PR, implemented in dependency order:

1. consolidate provider-neutral workflows, concise professional roles,
   contracts, templates, and tool capability bindings;
2. migrate useful legacy agency knowledge and remove the duplicate process;
3. rename the existing Drafts Storybook surface to Studio while preserving
   module stories, manifests, stable IDs, and presentation-only boundaries;
4. build the indexed workspace resolver, inheritance validation, artifact-first
   Storybook presentation, durable pre-development cursor, and the four-stage
   agent workflow;
5. validate the complete system on SinglePageStartup itself, with zero-content
   startup overrides proving the same inheritance path downstream projects use.

## Acceptance criteria

- A rough founder brief can be continued across fresh AI contexts without
  restating project history.
- Agents select the correct active layer, project knowledge, evidence, and
  dependencies deterministically from committed configuration and indexes.
- Different niches cannot silently accumulate each other's domain profile,
  discovery, acquisition, communication, or claim evidence.
- Consequential claims are sourced or explicitly classified; generated and
  reference assets keep provenance, rights, and usage limits.
- Business, research, strategy, brand, website, and asset decisions remain
  readable as Markdown/YAML beside their Storybook views.
- Studio presents the final business/marketing workspace and concrete design
  compositions; it does not expose engineering plans or become a second source
  of truth.
- The result is ready to hand to the existing engineering workflow without
  changing that workflow.
- Agent validation, workspace validation, inventory generation, and the
  production Storybook build pass.
