# Workspace

Workspace is the durable pre-development memory of a project. It contains the
business, market, communication, brand, and website-design decisions that AI
agents create and update before engineering begins.

Storybook is a read-only review surface over these files. The Markdown and YAML
files in this directory remain the source of truth.

## The three views

Every project artifact has two editable sources and one resolved view:

| View         | Purpose                                                             | Editable source                       |
| ------------ | ------------------------------------------------------------------- | ------------------------------------- |
| `singlepage` | The SinglePageStartup framework's own business and design knowledge | `<artifact>/singlepage.md` or `.yaml` |
| `startup`    | The current downstream project's changes                            | `<artifact>/startup.md` or `.yaml`    |
| `current`    | The effective result after applying the startup layer to singlepage | Read-only; assembled in memory        |

A new downstream project uses `startup` by default. Its startup files are
initially empty, so `current` passes the complete singlepage source through.
Agents write only the changes that belong to the active layer; they do not copy
unchanged framework content into startup files.

## Active layer

`config.yaml` selects which source agents may edit. Resolution order is:

1. an explicit layer supplied by the operator;
2. `active_layer` in the gitignored `config.local.yaml`;
3. a matching repository entry in `config.yaml`;
4. `default_layer`, which is `startup`.

The canonical `singlepagestartup/singlepagestartup` repository is mapped to
`singlepage`. Other repositories therefore work as startup projects without
requiring an environment variable or initial configuration step.

## Directory structure

```text
apps/studio/workspace/
  config.yaml                       active-layer defaults and repository mapping
  index/{singlepage,startup}.yaml   artifact graph and inheritance rules
  pre-development/<layer>.yaml      minimal resumable workflow cursor

  brief/                            founder request and constraints
  evidence/                         claims, sources, scope, and state
  business/                         model, economics, and operating process
  research/                         audience, market, and alternatives
  strategy/                         positioning, offer, and first experiment
  brand/                            communication and visual identity system
  website/                          visitor journey, final copy, and behavior
  assets/                           provenance- and rights-aware asset registry

  knowledge/
    decision-profile/               niche-specific completeness gates
    discovery/                      project-specific intake findings
    acquisition/                    project-specific channel decisions
    communication/                  project-specific content decisions

  design/                           current, singlepage, and startup compositions
  legacy/                           temporary compatibility records only
```

Each artifact or knowledge folder contains sibling `singlepage` and `startup`
sources. Final artifacts and working knowledge also expose Storybook stories.

## How inheritance works

Every layered entry in `index/startup.yaml` explicitly declares its
`extends` target and merge `strategy`:

| Strategy       | Used for                                                | Behavior                                                                   |
| -------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `sections`     | Brief, business, research, strategy, brand, website     | Startup replaces matching non-empty Markdown sections and may add sections |
| `keyed`        | Asset index                                             | Startup values replace or extend objects and arrays by stable ID           |
| `scoped-keyed` | Evidence                                                | Rows merge by stable ID while retaining their project scope and state      |
| `replace`      | Decision profile, discovery, acquisition, communication | Any meaningful startup content replaces the complete singlepage document   |

Replacement is intentional for niche-specific knowledge. A hosting framework's
market assumptions, acquisition research, or regulatory questions must not be
combined with those of an unrelated commercial-property business.

## Evidence boundaries

Every evidence row has a stable ID, `Scope`, and `State`.

- Scope is `singlepage`, `startup`, or `shared`.
- State is `active`, `not-applicable`, or `superseded`.
- In a startup project, inherited singlepage evidence remains visible as
  provenance but cannot support a startup claim.
- To use, correct, or reject inherited evidence, add a startup-scoped row with a
  stable ID and an explicit state.

This prevents a downstream project from treating facts about the framework as
facts about its own business.

## Pre-development stages

The `singlepagestartup` workflow uses four resumable stages:

1. `00-understand` — brief, evidence, decision profile, business, and research;
2. `10-decide` — positioning, offer, acquisition focus, and first experiment;
3. `20-package` — communication system, identity, and registered assets;
4. `30-design` — website content, conversion flow, and static Studio designs.

`pre-development/<layer>.yaml` stores only the current stage, status, active
artifacts, and blockers. It contains no duplicate business content or run
history. On every launch, agents reconcile this cursor against the living
artifacts, so work can continue in a fresh model context.

## How to use it

### Start or continue the project

Ask Codex or ChatGPT to run `singlepagestartup`, or say in plain language that
you want to start or continue pre-development. The coordinator will:

1. resolve the active layer;
2. reconcile the workflow cursor;
3. load only the active artifacts and their declared dependencies;
4. launch the relevant professional agents;
5. write results into the active layer's Markdown or YAML sources;
6. update the cursor and report unresolved questions.

Separate commands for stages or roles are not required.

### Change an existing decision

Describe the correction in plain language. For example:

```text
Change the primary audience from agencies to independent product teams and
update every affected pre-development artifact.
```

The coordinator updates the earliest artifact that owns the decision, computes
reverse dependencies from the indexes, and revisits only contradicted downstream
artifacts. There is no generic “edit document” command to remember.

### Review the result

- Open `current` to review what the active project effectively uses.
- Open `singlepage` to inspect the framework source.
- Open `startup` to inspect only the downstream override.
- Review `Workspace/Design/current` for the effective visual system and page
  compositions.
- Edit the source file shown in a story's `Sources` section, never the rendered
  Storybook page or generated inventory.

An empty startup view is expected. It means the corresponding current document
is inherited completely from singlepage.

## What belongs elsewhere

- Invariant professional methods: `.agents/roles/`
- Reusable artifact shapes: `.agents/templates/`
- Provider-neutral workflow and contracts: `.agents/workflows/` and
  `.agents/contracts/`
- Engineering tickets, research, plans, and handoffs: `thoughts/shared/`
- Production components and APIs: `libs/`, `apps/host`, and `apps/api`

Workspace intentionally ends at business, marketing, brand, and concrete static
website design. Production engineering, testing, analytics, and deployment use
the existing engineering workflow.

## Validation

Run these checks after changing workspace structure or inheritance:

```bash
npm run singlepagestartup:agents:validate
npm run studio:validate
npm run studio:storybook:build
```

For interactive review:

```bash
npm run studio:storybook
```
