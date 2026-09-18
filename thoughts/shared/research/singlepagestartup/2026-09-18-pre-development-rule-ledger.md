---
repository: singlepagestartup/singlepagestartup
date: 2026-09-18
status: phase-3-prose-rewritten
---

# Pre-development rule ledger, phase 1

Inventory of every normative sentence in the pre-development instruction corpus, with a provisional disposition per section. Nothing in the repository changes in this phase; the ledger is the checklist for the rewrite in phase 2, where every sentence must end in exactly one place or be removed with a recorded reason.

## Method

- A script splits each corpus file into sentences after removing frontmatter, tables and code blocks, keeps sentences that contain a normative marker, and attributes each one to its nearest heading. YAML templates contribute their comment lines. `CLAUDE.md` and `AGENTS.md` contribute only their pre-development section.
- Exact duplicates are detected on normalized text; near duplicates by word-shingle overlap.
- Dispositions are assigned per section, then overridden per sentence for exact duplicates, the readability restatements, the repeated editorial-pass boilerplate and the migration procedures.
- The tables were produced once by a throwaway extractor and generator that are not kept in the repository; the section map below is the complete record of the decisions they encoded, and the tab-separated `2026-09-18-pre-development-rule-ledger.tsv` beside this file is the machine-readable ledger with one row per sentence.

## Corpus and counts

- Files: 43. Sections: 239. Normative sentences: 2268.
- Exact duplicates: 104 sentences in 23 groups. Near duplicates: 14.

| Disposition                     | Sentences |
| ------------------------------- | --------- |
| `split`                         | 386       |
| `duplicate`                     | 317       |
| `operator-doc`                  | 230       |
| `role:*`                        | 206       |
| `template`                      | 182       |
| `role:brand-designer`           | 178       |
| `gate`                          | 144       |
| `contract:inheritance`          | 107       |
| `workflow`                      | 72        |
| `role:account-manager`          | 60        |
| `role:strategist`               | 57        |
| `migration`                     | 55        |
| `role:business-analyst`         | 55        |
| `contract:evidence`             | 48        |
| `role:market-researcher`        | 40        |
| `contract:confirmation`         | 39        |
| `contract:github`               | 35        |
| `role:communication-strategist` | 21        |
| `role:web-designer`             | 21        |
| `contract:editorial`            | 9         |
| `contract:tool-use`             | 6         |

| File                                                | Sentences | Exact duplicates |
| --------------------------------------------------- | --------- | ---------------- |
| `.agents/workflows/pre-development.md`              | 483       | 1                |
| `.agents/contracts/artifact-lifecycle.md`           | 66        | 0                |
| `.agents/contracts/context-loading.md`              | 96        | 0                |
| `.agents/contracts/document-confirmation.md`        | 69        | 0                |
| `.agents/contracts/document-readability.md`         | 13        | 0                |
| `.agents/contracts/editorial-pass.md`               | 17        | 0                |
| `.agents/contracts/evidence.md`                     | 57        | 0                |
| `.agents/contracts/github-reconciliation.md`        | 35        | 0                |
| `.agents/contracts/pipeline-reconciliation.md`      | 178       | 0                |
| `.agents/contracts/product-models.md`               | 98        | 0                |
| `.agents/contracts/research-sales-audit.md`         | 26        | 0                |
| `.agents/contracts/tool-use.md`                     | 6         | 0                |
| `.agents/roles/account-manager.md`                  | 78        | 3                |
| `.agents/roles/business-analyst.md`                 | 40        | 2                |
| `.agents/roles/market-researcher.md`                | 39        | 3                |
| `.agents/roles/strategist.md`                       | 73        | 2                |
| `.agents/roles/communication-strategist.md`         | 35        | 4                |
| `.agents/roles/brand-designer.md`                   | 111       | 4                |
| `.agents/roles/web-designer.md`                     | 37        | 3                |
| `.agents/templates/README.md`                       | 29        | 0                |
| `.agents/templates/brief.md`                        | 26        | 1                |
| `.agents/templates/strategy.md`                     | 18        | 0                |
| `.agents/templates/brand.md`                        | 8         | 0                |
| `.agents/templates/design.md`                       | 44        | 5                |
| `.agents/templates/product.md`                      | 15        | 1                |
| `.agents/templates/product-model.md`                | 11        | 1                |
| `.agents/templates/product-research.md`             | 17        | 2                |
| `.agents/templates/product-research-segment.md`     | 9         | 0                |
| `.agents/templates/product-research-competitors.md` | 7         | 0                |
| `.agents/templates/product-analytics.md`            | 6         | 0                |
| `.agents/templates/website.md`                      | 14        | 1                |
| `.agents/templates/creative.md`                     | 9         | 1                |
| `.agents/templates/products.yaml`                   | 12        | 0                |
| `.agents/templates/sales-process.yaml`              | 7         | 0                |
| `.agents/templates/asset-index.yaml`                | 11        | 0                |
| `.agents/README.md`                                 | 33        | 0                |
| `apps/studio/workspace/README.md`                   | 209       | 6                |
| `apps/studio/workspace/products/README.md`          | 16        | 0                |
| `apps/studio/README.md`                             | 78        | 1                |
| `CLAUDE.md`                                         | 60        | 2                |
| `AGENTS.md`                                         | 60        | 60               |
| `.claude/commands/singlepagestartup.md`             | 4         | 0                |
| `.codex/skills/singlepagestartup/SKILL.md`          | 8         | 1                |

## Disposition vocabulary

| Disposition     | Meaning in phase 2                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `gate`          | Executable check in the pipeline definition and check command                                           |
| `workflow`      | Stays in the compact orchestration workflow                                                             |
| `role:<id>`     | Professional method, lives in that one role file                                                        |
| `contract:<id>` | Cross-role rule in one contract: evidence, confirmation, inheritance, editorial, tool-use, github       |
| `template`      | Structural instruction that stays with the artifact template                                            |
| `migration`     | One-time retirement or migration procedure, moved to `.agents/migrations/` and loaded only on detection |
| `operator-doc`  | Operator or developer documentation, not an agent rule                                                  |
| `duplicate`     | Restates a rule owned elsewhere; removed                                                                |
| `split`         | The section mixes several of the above; the note names the parts                                        |

## Section map

The review unit. Each row is one section of one file with its sentence count, how many are exact duplicates, the provisional disposition and where the surviving rules go.

### `.agents/workflows/pre-development.md`

| Section                               | Sentences | Dup | Disposition | Target                                                                       | Note                                                                                                                                                                                                                                                                                                |
| ------------------------------------- | --------- | --- | ----------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry                                 | 7         | 0   | `split`     | workflow + contract:inheritance                                              | layer resolution stays in workflow; write-only-to-active-layer rule belongs to the inheritance contract                                                                                                                                                                                             |
| GitHub change preflight               | 7         | 0   | `split`     | workflow + duplicate                                                         | keep the command and fail-closed rule; the rest restates github-reconciliation.md                                                                                                                                                                                                                   |
| Quality and interaction rules         | 22        | 0   | `split`     | workflow + contract:evidence + duplicate                                     | unknown classification duplicates evidence.md; readability duplicates document-readability.md; language and one-question rules stay in workflow                                                                                                                                                     |
| Durable state                         | 6         | 0   | `split`     | workflow + gate                                                              | cursor schema, allowed stages and statuses become a pipeline gate; write-after-update stays in workflow                                                                                                                                                                                             |
| Pipeline compatibility reconciliation | 16        | 0   | `gate`      | gate                                                                         | becomes the check command; prose restates pipeline-reconciliation.md                                                                                                                                                                                                                                |
| Start or continue                     | 17        | 0   | `workflow`  | workflow                                                                     | the core loop; keep, shorten                                                                                                                                                                                                                                                                        |
| Change an existing decision           | 15        | 0   | `split`     | workflow + duplicate                                                         | steps 3 and 5 restate document-confirmation.md and evidence.md asset cleanup                                                                                                                                                                                                                        |
| Domain adaptation and quality gate    | 25        | 0   | `split`     | role:\* + gate + duplicate                                                   | generic professional checks belong to roles; approval reads become gates; question classification duplicates evidence.md                                                                                                                                                                            |
| 00 — Client Request                   | 49        | 0   | `split`     | gate + role:account-manager + role:business-analyst + duplicate              | state, owners, outputs and completion become pipeline entries; intake method belongs to the two roles; visual intake rules are restated in account-manager, brand-designer and the brief template                                                                                                   |
| 10 — Strategy                         | 59        | 0   | `split`     | gate + role:market-researcher + role:strategist + duplicate                  | state, owners, five sections and confirmation become pipeline entries; target-state rules duplicate strategist.md and pipeline-reconciliation.md                                                                                                                                                    |
| 20 — Brand                            | 16        | 0   | `split`     | gate + role:communication-strategist + role:brand-designer                   | state, five sections and confirmation become pipeline entries; the rest is role method                                                                                                                                                                                                              |
| 30 — Design                           | 131       | 0   | `split`     | gate + role:brand-designer + contract:inheritance + operator-doc + duplicate | gates: five categories ready, profile confirmed, three examples per media family, typography rows with registered fonts, proposal_id and asset tree reconciled; 131 sentences of method duplicate brand-designer.md and the design template; Studio layout mechanics belong to the workspace README |
| 40 — Products                         | 91        | 1   | `split`     | gate + role:\* + contract:inheritance + duplicate                            | catalog, product, analytics, sales and research structure are already validator gates; product method belongs to the owning roles; atomic catalog rule duplicates the inheritance contract; most sentences restate product-models.md                                                                |
| Ownership and concurrency             | 6         | 0   | `workflow`  | workflow                                                                     | keep                                                                                                                                                                                                                                                                                                |
| Tool launch                           | 10        | 0   | `split`     | workflow + duplicate                                                         | adapter loading stays; capability rules duplicate tool-use.md                                                                                                                                                                                                                                       |
| Handoff                               | 4         | 0   | `workflow`  | workflow                                                                     | keep as the single handoff contract                                                                                                                                                                                                                                                                 |
| Final editorial pass                  | 2         | 0   | `duplicate` | contract:editorial                                                           | boilerplate section repeated in every file                                                                                                                                                                                                                                                          |

### `.agents/contracts/artifact-lifecycle.md`

| Section                  | Sentences | Dup | Disposition | Target                                                                                  | Note                                                                                                                                                                                                                              |
| ------------------------ | --------- | --- | ----------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Living artifact contract | 66        | 0   | `split`     | contract:inheritance + contract:confirmation + contract:evidence + workflow + duplicate | retire the file: inheritance rules move to the inheritance contract, asset lifecycle to evidence.md, approval rules duplicate document-confirmation.md, quality-over-length and one-decision-per-topic become workflow principles |

### `.agents/contracts/context-loading.md`

| Section                       | Sentences | Dup | Disposition            | Target                              | Note                                                                                     |
| ----------------------------- | --------- | --- | ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| Resolution                    | 39        | 0   | `split`                | contract:inheritance + gate         | layer resolver and index registry rules; index validation already executes in the loader |
| Project artifact resolution   | 25        | 0   | `contract:inheritance` | contract:inheritance                | merge strategies and write-only-active-layer rule                                        |
| Shared agent resources        | 5         | 0   | `contract:inheritance` | contract:inheritance                | imports and exports                                                                      |
| Decision-scoped context       | 11        | 0   | `workflow`             | workflow                            | loading rule for one invocation                                                          |
| Presentation content contract | 6         | 0   | `split`                | gate + operator-doc                 | YAML schema is already validated; renderer contract is developer documentation           |
| Design layout context         | 10        | 0   | `split`                | contract:inheritance + operator-doc | layout inheritance rule; schema details belong to the workspace README                   |

### `.agents/contracts/document-confirmation.md`

| Section                                     | Sentences | Dup | Disposition             | Target                       | Note                                                                                           |
| ------------------------------------------- | --------- | --- | ----------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Document confirmation                       | 16        | 0   | `split`                 | contract:confirmation + gate | fingerprint validity is already executable                                                     |
| Content ownership and semantic dependencies | 6         | 0   | `contract:confirmation` | contract:confirmation        | keep, trim                                                                                     |
| Status and upstream review                  | 25        | 0   | `split`                 | contract:confirmation + gate | four states are executable; impact-review transitions stay as contract                         |
| Layer resolution                            | 16        | 0   | `contract:confirmation` | contract:confirmation        | confirmation across layers; keep here rather than in the inheritance contract                  |
| Stage gates and GitHub baseline             | 6         | 0   | `split`                 | gate + contract:github       | approval gates become pipeline entries; baseline detection belongs to github-reconciliation.md |

### `.agents/contracts/document-readability.md`

| Section                             | Sentences | Dup | Disposition | Target               | Note                                                                                                   |
| ----------------------------------- | --------- | --- | ----------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| Review readability and completeness | 13        | 0   | `split`     | workflow + duplicate | one paragraph of workflow principle; the file is retired and its 31 restatements elsewhere are removed |

### `.agents/contracts/editorial-pass.md`

| Section              | Sentences | Dup | Disposition          | Target             | Note       |
| -------------------- | --------- | --- | -------------------- | ------------------ | ---------- |
| Final editorial pass | 5         | 0   | `contract:editorial` | contract:editorial | keep as is |
| Editing rules        | 11        | 0   | `contract:editorial` | contract:editorial | keep as is |
| Completion check     | 1         | 0   | `contract:editorial` | contract:editorial | keep as is |

### `.agents/contracts/evidence.md`

| Section          | Sentences | Dup | Disposition         | Target                   | Note                                                                             |
| ---------------- | --------- | --- | ------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| Claims           | 14        | 0   | `contract:evidence` | contract:evidence        | keep, trim role duplicates                                                       |
| Source ownership | 20        | 0   | `contract:evidence` | contract:evidence        | keep, trim role duplicates                                                       |
| Assets           | 21        | 0   | `split`             | contract:evidence + gate | registry field rules and generated-asset tree reconciliation are gate candidates |
| Research conduct | 2         | 0   | `contract:evidence` | contract:evidence        | keep, trim role duplicates                                                       |

### `.agents/contracts/github-reconciliation.md`

| Section              | Sentences | Dup | Disposition       | Target          | Note       |
| -------------------- | --------- | --- | ----------------- | --------------- | ---------- |
| Purpose and boundary | 12        | 0   | `contract:github` | contract:github | keep, trim |
| Baseline and ledger  | 7         | 0   | `contract:github` | contract:github | keep, trim |
| Reconciliation       | 13        | 0   | `contract:github` | contract:github | keep, trim |
| Approval effects     | 3         | 0   | `contract:github` | contract:github | keep, trim |

### `.agents/contracts/pipeline-reconciliation.md`

| Section                                                | Sentences | Dup | Disposition            | Target                                        | Note                                                                                                                                       |
| ------------------------------------------------------ | --------- | --- | ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Purpose                                                | 5         | 0   | `split`                | gate + workflow                               | the check command replaces the prose; the no-stored-version principle stays as one sentence                                                |
| Retiring the former Decision Profile                   | 9         | 0   | `migration`            | migration                                     | dated procedure, loaded when knowledge/decision-profile is detected                                                                        |
| Retiring standalone Business                           | 12        | 0   | `migration`            | migration                                     | dated procedure, loaded when a Business source or v1 catalog is detected                                                                   |
| Compact Brief migration                                | 12        | 0   | `migration`            | migration                                     | dated procedure, loaded when legacy Brief headings are detected                                                                            |
| Compact Strategy migration                             | 11        | 0   | `migration`            | migration                                     | dated procedure, loaded when legacy Strategy sections or anchors are detected                                                              |
| Strategy consistency across projects                   | 16        | 0   | `split`                | contract:inheritance + gate + role:strategist | downstream authoring rule; five sections are a gate; target-state judgment belongs to the strategist                                       |
| Business-plan product consistency across projects      | 22        | 0   | `split`                | role:\* + gate + migration                    | business-plan framing belongs to roles; analytics and readiness are gates; the Evidence-and-decision-rules replacement is a migration step |
| Compact Brand migration                                | 6         | 0   | `migration`            | migration                                     | dated procedure                                                                                                                            |
| Inspection scope                                       | 22        | 0   | `gate`                 | gate                                          | this section is the specification of the check command                                                                                     |
| Layer and inheritance rules                            | 26        | 0   | `contract:inheritance` | contract:inheritance                          |                                                                                                                                            |
| Gap classification and repair                          | 11        | 0   | `split`                | workflow + gate                               | classification and cursor movement stay in workflow; structural gaps come from the check output                                            |
| Handoff                                                | 2         | 0   | `workflow`             | workflow                                      | merge into the single handoff contract                                                                                                     |
| Preserve product identity during structural migrations | 12        | 0   | `split`                | gate + migration                              | catalog-versus-Brief inventory match is a gate; Portfolio and presentation migration steps are migrations                                  |
| Sales segment compatibility                            | 7         | 0   | `split`                | gate + migration                              | segment coverage is already a validator gate; v1-to-v2 transfer is a migration                                                             |
| Material workspace compatibility                       | 5         | 0   | `migration`            | migration                                     | one-time material workspace adoption                                                                                                       |

### `.agents/contracts/product-models.md`

| Section                              | Sentences | Dup | Disposition    | Target                                                                            | Note                                                                                                                           |
| ------------------------------------ | --------- | --- | -------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Model and layer boundary             | 7         | 0   | `split`        | gate + contract:inheritance                                                       | catalog v2 schema and acyclic uses are already validated; atomic replacement belongs to the inheritance contract               |
| Whole-page ownership                 | 11        | 0   | `split`        | gate + template                                                                   | canonical H2 sets are gates; the ownership table belongs to the templates README                                               |
| Work order and evidence              | 9         | 0   | `split`        | workflow + role:business-analyst                                                  |                                                                                                                                |
| Business planning before engineering | 11        | 0   | `role:*`       | role:strategist + role:business-analyst + role:web-designer + role:brand-designer | one shared paragraph per role instead of a contract                                                                            |
| Segmented Sales workspace            | 23        | 0   | `split`        | gate + role:business-analyst + operator-doc                                       | segment ID coverage is validated; CJM method belongs to the business analyst; Studio rendering belongs to the workspace README |
| Dependencies                         | 12        | 0   | `gate`         | gate                                                                              | review edges are implemented in review.ts; document them once beside the pipeline definition                                   |
| Material workspaces                  | 13        | 0   | `operator-doc` | operator-doc                                                                      | Studio navigation and export behavior                                                                                          |
| Language and vocabulary              | 12        | 0   | `split`        | template + operator-doc                                                           | localization rule belongs to the website and creative templates                                                                |

### `.agents/contracts/research-sales-audit.md`

| Section                                       | Sentences | Dup | Disposition              | Target                 | Note                                                                  |
| --------------------------------------------- | --------- | --- | ------------------------ | ---------------------- | --------------------------------------------------------------------- |
| Research of Sales segments and alternatives   | 3         | 0   | `role:market-researcher` | role:market-researcher |                                                                       |
| Workspace and coverage                        | 8         | 0   | `gate`                   | gate                   | sales_audit, sales_segment and sales_dimensions are already validated |
| Investigation and resulting reference         | 13        | 0   | `role:market-researcher` | role:market-researcher |                                                                       |
| Review dependencies without an approval cycle | 2         | 0   | `gate`                   | gate                   | observes edges are implemented                                        |

### `.agents/contracts/tool-use.md`

| Section                  | Sentences | Dup | Disposition         | Target            | Note |
| ------------------------ | --------- | --- | ------------------- | ----------------- | ---- |
| Tool capability contract | 6         | 0   | `contract:tool-use` | contract:tool-use | keep |

### `.agents/roles/account-manager.md`

| Section                  | Sentences | Dup | Disposition            | Target                           | Note                                                                                                                           |
| ------------------------ | --------- | --- | ---------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Mission and boundary     | 3         | 0   | `role:account-manager` | role:account-manager             | professional method stays; remove workflow and structure restatements                                                          |
| Inputs and ownership     | 1         | 0   | `split`                | role + duplicate                 | which files the role reads restates the workflow stage; keep only the refusal conditions                                       |
| Required method          | 51        | 1   | `split`                | role:account-manager + duplicate | 51 sentences; visual intake mechanics are restated in brand-designer.md, the brief template and the workflow 30-design section |
| Thresholds and red flags | 14        | 0   | `role:account-manager` | role:account-manager             | professional method stays; remove workflow and structure restatements                                                          |
| Capabilities             | 1         | 0   | `gate`                 | gate                             | capability IDs per owner belong to the pipeline definition                                                                     |
| Handoff                  | 6         | 0   | `split`                | workflow + duplicate             | one handoff contract in the workflow; role-specific items stay as one line                                                     |
| Final editorial pass     | 2         | 2   | `duplicate`            | contract:editorial               | boilerplate section repeated in every file                                                                                     |

### `.agents/roles/business-analyst.md`

| Section                  | Sentences | Dup | Disposition             | Target                | Note                                                                                     |
| ------------------------ | --------- | --- | ----------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| Mission and boundary     | 4         | 0   | `role:business-analyst` | role:business-analyst | professional method stays; remove workflow and structure restatements                    |
| Inputs and ownership     | 5         | 0   | `split`                 | role + duplicate      | which files the role reads restates the workflow stage; keep only the refusal conditions |
| Required method          | 24        | 0   | `role:business-analyst` | role:business-analyst | professional method stays; remove workflow and structure restatements                    |
| Thresholds and red flags | 2         | 0   | `role:business-analyst` | role:business-analyst | professional method stays; remove workflow and structure restatements                    |
| Capabilities             | 1         | 0   | `gate`                  | gate                  | capability IDs per owner belong to the pipeline definition                               |
| Handoff                  | 2         | 0   | `split`                 | workflow + duplicate  | one handoff contract in the workflow; role-specific items stay as one line               |
| Final editorial pass     | 2         | 2   | `duplicate`             | contract:editorial    | boilerplate section repeated in every file                                               |

### `.agents/roles/market-researcher.md`

| Section                  | Sentences | Dup | Disposition              | Target                 | Note                                                                                     |
| ------------------------ | --------- | --- | ------------------------ | ---------------------- | ---------------------------------------------------------------------------------------- |
| Mission and boundary     | 3         | 0   | `role:market-researcher` | role:market-researcher | professional method stays; remove workflow and structure restatements                    |
| Inputs and ownership     | 7         | 0   | `split`                  | role + duplicate       | which files the role reads restates the workflow stage; keep only the refusal conditions |
| Required method          | 16        | 0   | `role:market-researcher` | role:market-researcher | professional method stays; remove workflow and structure restatements                    |
| Thresholds and red flags | 7         | 0   | `role:market-researcher` | role:market-researcher | professional method stays; remove workflow and structure restatements                    |
| Capabilities             | 1         | 0   | `gate`                   | gate                   | capability IDs per owner belong to the pipeline definition                               |
| Handoff                  | 3         | 1   | `split`                  | workflow + duplicate   | one handoff contract in the workflow; role-specific items stay as one line               |
| Final editorial pass     | 2         | 2   | `duplicate`              | contract:editorial     | boilerplate section repeated in every file                                               |

### `.agents/roles/strategist.md`

| Section                  | Sentences | Dup | Disposition       | Target               | Note                                                                                     |
| ------------------------ | --------- | --- | ----------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| Mission and boundary     | 4         | 0   | `role:strategist` | role:strategist      | professional method stays; remove workflow and structure restatements                    |
| Inputs and ownership     | 13        | 0   | `split`           | role + duplicate     | which files the role reads restates the workflow stage; keep only the refusal conditions |
| Required method          | 45        | 0   | `role:strategist` | role:strategist      | professional method stays; remove workflow and structure restatements                    |
| Thresholds and red flags | 5         | 0   | `role:strategist` | role:strategist      | professional method stays; remove workflow and structure restatements                    |
| Capabilities             | 1         | 0   | `gate`            | gate                 | capability IDs per owner belong to the pipeline definition                               |
| Handoff                  | 3         | 0   | `split`           | workflow + duplicate | one handoff contract in the workflow; role-specific items stay as one line               |
| Final editorial pass     | 2         | 2   | `duplicate`       | contract:editorial   | boilerplate section repeated in every file                                               |

### `.agents/roles/communication-strategist.md`

| Section                  | Sentences | Dup | Disposition                     | Target                        | Note                                                                                     |
| ------------------------ | --------- | --- | ------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| Mission and boundary     | 3         | 0   | `role:communication-strategist` | role:communication-strategist | professional method stays; remove workflow and structure restatements                    |
| Inputs and ownership     | 5         | 0   | `split`                         | role + duplicate              | which files the role reads restates the workflow stage; keep only the refusal conditions |
| Required method          | 12        | 0   | `role:communication-strategist` | role:communication-strategist | professional method stays; remove workflow and structure restatements                    |
| Thresholds and red flags | 9         | 1   | `role:communication-strategist` | role:communication-strategist | professional method stays; remove workflow and structure restatements                    |
| Capabilities             | 1         | 1   | `gate`                          | gate                          | capability IDs per owner belong to the pipeline definition                               |
| Handoff                  | 3         | 0   | `split`                         | workflow + duplicate          | one handoff contract in the workflow; role-specific items stay as one line               |
| Final editorial pass     | 2         | 2   | `duplicate`                     | contract:editorial            | boilerplate section repeated in every file                                               |

### `.agents/roles/brand-designer.md`

| Section                  | Sentences | Dup | Disposition           | Target                          | Note                                                                                                                   |
| ------------------------ | --------- | --- | --------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Mission and boundary     | 3         | 0   | `role:brand-designer` | role:brand-designer             | professional method stays; remove workflow and structure restatements                                                  |
| Inputs and ownership     | 8         | 0   | `split`               | role + duplicate                | which files the role reads restates the workflow stage; keep only the refusal conditions                               |
| Required method          | 90        | 0   | `split`               | role:brand-designer + duplicate | 90 sentences; media, typography and asset rules are restated in the workflow 30-design section and the design template |
| Thresholds and red flags | 2         | 0   | `role:brand-designer` | role:brand-designer             | professional method stays; remove workflow and structure restatements                                                  |
| Capabilities             | 1         | 0   | `gate`                | gate                            | capability IDs per owner belong to the pipeline definition                                                             |
| Handoff                  | 5         | 2   | `split`               | workflow + duplicate            | one handoff contract in the workflow; role-specific items stay as one line                                             |
| Final editorial pass     | 2         | 2   | `duplicate`           | contract:editorial              | boilerplate section repeated in every file                                                                             |

### `.agents/roles/web-designer.md`

| Section                  | Sentences | Dup | Disposition         | Target               | Note                                                                                     |
| ------------------------ | --------- | --- | ------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| Mission and boundary     | 3         | 0   | `role:web-designer` | role:web-designer    | professional method stays; remove workflow and structure restatements                    |
| Inputs and ownership     | 11        | 0   | `split`             | role + duplicate     | which files the role reads restates the workflow stage; keep only the refusal conditions |
| Required method          | 16        | 0   | `role:web-designer` | role:web-designer    | professional method stays; remove workflow and structure restatements                    |
| Thresholds and red flags | 3         | 0   | `role:web-designer` | role:web-designer    | professional method stays; remove workflow and structure restatements                    |
| Capabilities             | 1         | 1   | `gate`              | gate                 | capability IDs per owner belong to the pipeline definition                               |
| Handoff                  | 1         | 0   | `split`             | workflow + duplicate | one handoff contract in the workflow; role-specific items stay as one line               |
| Final editorial pass     | 2         | 2   | `duplicate`         | contract:editorial   | boilerplate section repeated in every file                                               |

### `.agents/templates/README.md`

| Section                            | Sentences | Dup | Disposition | Target           | Note                                                                                        |
| ---------------------------------- | --------- | --- | ----------- | ---------------- | ------------------------------------------------------------------------------------------- |
| Pre-development artifact templates | 4         | 0   | `template`  | template         |                                                                                             |
| Sequence                           | 16        | 0   | `split`     | gate + duplicate | the owner and output table is the stage machine; the surrounding rules restate the workflow |
| Provenance                         | 9         | 0   | `template`  | template         |                                                                                             |

### `.agents/templates/brief.md`

| Section                 | Sentences | Dup | Disposition | Target               | Note                                                                           |
| ----------------------- | --------- | --- | ----------- | -------------------- | ------------------------------------------------------------------------------ |
| Brief                   | 7         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Project and products    | 1         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Customers and value     | 2         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Current state           | 1         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Business and resources  | 2         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Goals and success       | 1         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Visual reference intake | 12        | 1   | `split`     | template + duplicate | comment restates account-manager.md                                            |

### `.agents/templates/strategy.md`

| Section                     | Sentences | Dup | Disposition | Target   | Note                                                                           |
| --------------------------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Strategy                    | 8         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Strategic direction         | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Audiences and product roles | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Growth system               | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Customer journey            | 3         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Measurement and priorities  | 4         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/brand.md`

| Section             | Sentences | Dup | Disposition | Target   | Note                                                                           |
| ------------------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Brand               | 4         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Brand identity      | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Intended perception | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Voice and language  | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Consistency rules   | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/design.md`

| Section                          | Sentences | Dup | Disposition | Target               | Note                                                                           |
| -------------------------------- | --------- | --- | ----------- | -------------------- | ------------------------------------------------------------------------------ |
| Design                           | 7         | 1   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Client visual preference profile | 3         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Brand idea and character         | 1         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Reusable graphic language        | 1         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Typography                       | 1         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Interface and product surfaces   | 12        | 1   | `split`     | template + duplicate | comment restates the brand-designer method                                     |
| Purpose and evidence boundary    | 3         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Controls, states, and actions    | 1         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Confirmed reference patterns     | 1         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Review and quality gate          | 6         | 2   | `split`     | template + gate      | three-example and registry checks are gate candidates                          |
| Style master prompt              | 3         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Production specification         | 4         | 1   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |
| Outputs and provenance           | 1         | 0   | `template`  | template             | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/product.md`

| Section                    | Sentences | Dup | Disposition | Target   | Note                                                                           |
| -------------------------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Product                    | 5         | 1   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Customer Segments          | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Value Propositions         | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Offer and usage            | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Business goals and metrics | 5         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/product-model.md`

| Section                        | Sentences | Dup | Disposition | Target   | Note                                                                           |
| ------------------------------ | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Operations & Economics         | 3         | 1   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Key Activities                 | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Key Resources                  | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Key Partnerships               | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Cost Structure                 | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Funding                        | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Assumptions and decision rules | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/product-research.md`

| Section                      | Sentences | Dup | Disposition | Target   | Note                                                                           |
| ---------------------------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Product research             | 3         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Decision and scope           | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Alternatives and competition | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Findings and unknowns        | 7         | 1   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Sources                      | 4         | 1   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/product-research-segment.md`

| Section                              | Sentences | Dup | Disposition | Target   | Note                                                                           |
| ------------------------------------ | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Segment research                     | 3         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Needs and reasons to choose          | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Acquisition and Customer Journey Map | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Commercial conclusions               | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Sources                              | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/product-research-competitors.md`

| Section                      | Sentences | Dup | Disposition | Target   | Note                                                                           |
| ---------------------------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Competitors and alternatives | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Offer comparison             | 3         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Alternative detail           | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/product-analytics.md`

| Section                     | Sentences | Dup | Disposition | Target   | Note                                                                           |
| --------------------------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Product analytics           | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Measurement scope           | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Product usage and retention | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Sources and limitations     | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/website.md`

| Section                             | Sentences | Dup | Disposition | Target   | Note                                                                           |
| ----------------------------------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Website                             | 5         | 1   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Objective and customer result       | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Customer journey and site structure | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Key product interactions            | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Page copy and metadata              | 6         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/creative.md`

| Section                             | Sentences | Dup | Disposition | Target   | Note                                                                           |
| ----------------------------------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Marketing Creative                  | 1         | 1   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Objective and selected distribution | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Message-to-format plan              | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Creative system application         | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Production specification            | 5         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/products.yaml`

| Section                                                                    | Sentences | Dup | Disposition | Target   | Note                                                                           |
| -------------------------------------------------------------------------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| (top)                                                                      | 9         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| Materials below are optional until their stage; declared files must exist. | 1         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |
| export: pdf                                                                | 2         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/sales-process.yaml`

| Section | Sentences | Dup | Disposition | Target   | Note                                                                           |
| ------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| (top)   | 7         | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/templates/asset-index.yaml`

| Section | Sentences | Dup | Disposition | Target   | Note                                                                           |
| ------- | --------- | --- | ----------- | -------- | ------------------------------------------------------------------------------ |
| (top)   | 11        | 0   | `template`  | template | structure and comment instructions; trim comments that restate the owning role |

### `.agents/README.md`

| Section                               | Sentences | Dup | Disposition    | Target               | Note                                                 |
| ------------------------------------- | --------- | --- | -------------- | -------------------- | ---------------------------------------------------- |
| SinglePageStartup agent system        | 1         | 0   | `operator-doc` | operator-doc         | directory index                                      |
| Ownership                             | 8         | 0   | `operator-doc` | operator-doc         | directory index                                      |
| Loading rule                          | 14        | 0   | `duplicate`    | workflow             | restates the workflow entry and inheritance contract |
| Pre-development workspace projections | 10        | 0   | `duplicate`    | contract:inheritance | restates the three projections                       |

### `apps/studio/workspace/README.md`

| Section                                   | Sentences | Dup | Disposition    | Target                   | Note                                                                |
| ----------------------------------------- | --------- | --- | -------------- | ------------------------ | ------------------------------------------------------------------- |
| Workspace                                 | 4         | 0   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| Review order                              | 5         | 0   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| Document review status                    | 14        | 0   | `operator-doc` | operator-doc             | keep the badge table                                                |
| The three views                           | 2         | 0   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| File map                                  | 15        | 5   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| Product catalogs                          | 16        | 1   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| Additional product pages                  | 31        | 0   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| 00 Client Request                         | 9         | 0   | `duplicate`    | workflow                 | restates the stage definition                                       |
| 10 Strategy                               | 6         | 0   | `duplicate`    | workflow                 | restates the stage definition                                       |
| 20 Brand                                  | 2         | 0   | `duplicate`    | workflow                 | restates the stage definition                                       |
| 30 Design                                 | 3         | 0   | `duplicate`    | workflow                 | restates the stage definition                                       |
| Project-specific Design structure         | 31        | 0   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| 40 Products                               | 12        | 0   | `duplicate`    | workflow                 | restates the stage definition                                       |
| Working with agents                       | 12        | 0   | `split`        | operator-doc + duplicate | keep the operator view; remove the restated pipeline mechanics      |
| Boundaries                                | 2         | 0   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| Source ownership and semantic review      | 10        | 0   | `duplicate`    | contract:confirmation    |                                                                     |
| Producing and exporting product materials | 8         | 0   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| Language and vocabulary                   | 6         | 0   | `operator-doc` | operator-doc             | operator and developer documentation                                |
| Sales customer segments and CJM           | 16        | 0   | `split`        | operator-doc + duplicate | keep the review description; schema rules restate product-models.md |
| Research audits of Sales segments         | 5         | 0   | `duplicate`    | contract:evidence        |                                                                     |

### `apps/studio/workspace/products/README.md`

| Section                 | Sentences | Dup | Disposition    | Target       | Note |
| ----------------------- | --------- | --- | -------------- | ------------ | ---- |
| Product directory guide | 1         | 0   | `operator-doc` | operator-doc |      |
| Models and products     | 6         | 0   | `operator-doc` | operator-doc |      |
| Inside one product      | 4         | 0   | `operator-doc` | operator-doc |      |
| Startup reuse           | 5         | 0   | `operator-doc` | operator-doc |      |

### `apps/studio/README.md`

| Section                    | Sentences | Dup | Disposition    | Target                   | Note                                                              |
| -------------------------- | --------- | --- | -------------- | ------------------------ | ----------------------------------------------------------------- |
| SinglePageStartup Studio   | 7         | 0   | `operator-doc` | operator-doc             | developer documentation                                           |
| Production Docker boundary | 6         | 0   | `operator-doc` | operator-doc             | developer documentation                                           |
| Commands                   | 5         | 0   | `operator-doc` | operator-doc             | developer documentation                                           |
| Browser PDF export         | 7         | 0   | `operator-doc` | operator-doc             | developer documentation                                           |
| Portable document export   | 5         | 0   | `operator-doc` | operator-doc             | developer documentation                                           |
| Layout                     | 1         | 0   | `operator-doc` | operator-doc             | developer documentation                                           |
| Workspace presentation     | 23        | 0   | `split`        | operator-doc + duplicate | keep the Storybook description; remove restated inheritance rules |
| Document confirmation      | 14        | 1   | `duplicate`    | contract:confirmation    | reduce to a pointer                                               |
| Figma metadata             | 3         | 0   | `operator-doc` | operator-doc             | developer documentation                                           |
| Guardrails                 | 7         | 0   | `operator-doc` | operator-doc             | developer documentation                                           |

### `CLAUDE.md`

| Section                  | Sentences | Dup | Disposition | Target   | Note                                                     |
| ------------------------ | --------- | --- | ----------- | -------- | -------------------------------------------------------- |
| Pre-development workflow | 60        | 2   | `duplicate` | workflow | replace the pre-development summary with a short pointer |

### `AGENTS.md`

| Section                  | Sentences | Dup | Disposition | Target   | Note                                                  |
| ------------------------ | --------- | --- | ----------- | -------- | ----------------------------------------------------- |
| Pre-development workflow | 60        | 60  | `duplicate` | workflow | identical to CLAUDE.md; replace with the same pointer |

### `.claude/commands/singlepagestartup.md`

| Section                 | Sentences | Dup | Disposition | Target   | Note                                      |
| ----------------------- | --------- | --- | ----------- | -------- | ----------------------------------------- |
| Claude workflow adapter | 4         | 0   | `workflow`  | workflow | adapter; keep, point at the check command |

### `.codex/skills/singlepagestartup/SKILL.md`

| Section              | Sentences | Dup | Disposition | Target             | Note                                      |
| -------------------- | --------- | --- | ----------- | ------------------ | ----------------------------------------- |
| singlepagestartup    | 6         | 1   | `workflow`  | workflow           | adapter; keep, point at the check command |
| Final editorial pass | 2         | 0   | `duplicate` | contract:editorial |                                           |

## Exact duplicate groups

Sentences repeated verbatim in two or more places. The first occurrence is the reference; phase 2 keeps one owner.

| Copies | Reference                                          | Sentence                                                                                                                                     |
| ------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 55     | `CLAUDE.md:101`                                    | Studio consistently exposes `singlepage`, `startup`, and resolved `default`; agents edit only the active source layer and never write a defa |
| 15     | `.agents/workflows/pre-development.md:1218`        | This is the last content-editing step before returning or storing the text.                                                                  |
| 6      | `.agents/templates/brand.md:8`                     | Use current facts and concrete communication choices; sources stay in claim-keyed metadata, without visible downstream citations, interview  |
| 5      | `CLAUDE.md:234`                                    | The agent researches external sources only when the current project needs fresh evidence.                                                    |
| 4      | `.agents/contracts/context-loading.md:83`          | No compatibility copy is kept at old paths.                                                                                                  |
| 3      | `.agents/contracts/product-models.md:229`          | Apply `.agents/contracts/research-sales-audit.md` for segment-by-segment Sales validation, competitor detail, evidence verdicts and the reus |
| 3      | `.agents/roles/communication-strategist.md:91`     | Advertising/deck copy may apply approved facts but never establishes a second price, scope or support commitment; inspect stale dependencies |
| 3      | `.agents/templates/design.md:153`                  | Studio does not render it as a human-review card.                                                                                            |
| 3      | `.agents/contracts/context-loading.md:49`          | Products keep their catalog, Markdown, YAML data, and product-specific React entry points together.                                          |
| 3      | `.agents/roles/business-analyst.md:11`             | Later process designs remain explicit proposals.                                                                                             |
| 3      | `.agents/templates/product.md:9`                   | Follow .agents/contracts/product-models.md.                                                                                                  |
| 2      | `.agents/workflows/pre-development.md:583`         | **Capabilities**: artifact read/write, image inspection/generation and Figma when available, plus static Studio composition; no production d |
| 2      | `.agents/workflows/pre-development.md:178`         | Recompute the earliest incomplete stage, persist the cursor, then return decisions, unresolved evidence, and a clear handoff.                |
| 2      | `.agents/contracts/pipeline-reconciliation.md:194` | A changed meaning requires review and cannot inherit an old body approval; valid visual inputs remain in Brief and Assets for Design.        |
| 2      | `.agents/roles/strategist.md:177`                  | `artifact-read`, `artifact-write`, `web-research`, `document-creation`.                                                                      |
| 2      | `.agents/roles/brand-designer.md:241`              | `artifact-read`, `artifact-write`, `web-research`, `browser-interaction`, `image-inspection`, `image-generation`, `figma-interaction`.       |
| 2      | `.agents/workflows/pre-development.md:324`         | Preserve already confirmed descriptions when their references and preference are unchanged.                                                  |
| 2      | `.agents/workflows/pre-development.md:901`         | Review the specimens in a browser and verify computed styles, not appearance alone.                                                          |
| 2      | `.agents/templates/design.md:177`                  | Studio exposes this guidance from the information icon beside Style master prompt; do not create a separate visible card.                    |
| 2      | `.agents/roles/market-researcher.md:44`            | Retain every source needed for material findings and counterevidence; no source-count cap applies.                                           |
| 2      | `.agents/contracts/product-models.md:51`           | The initial stage persists; it no longer has a Business output.                                                                              |
| 2      | `.agents/contracts/document-confirmation.md:64`    | Metadata-only edits do not change body fingerprints.                                                                                         |
| 2      | `.claude/commands/singlepagestartup.md:9`          | After reading that cursor, run the mandatory pipeline compatibility reconciliation from `.agents/contracts/pipeline-reconciliation.md` befor |

## Readability restatements

72 sentences restate the five-to-seven-minute or about-1,400-words preference across 32 files. Phase 2 keeps one paragraph in the workflow and removes the rest.

| Where                                                 | Sentence                                                                                                                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/workflows/pre-development.md:61`             | `brief`, each model, each product `research`, `strategy`, `brand`, `design`, and each product-local `product`, `website`, and `creative` doc |
| `.agents/workflows/pre-development.md:61`             | This is a preference, never a hard word, line, source or segment cap.                                                                        |
| `.agents/workflows/pre-development.md:61`             | Follow `.agents/contracts/document-readability.md`: preserve material information and use navigable detail pages when needed.                |
| `.agents/workflows/pre-development.md:73`             | Do not use unexplained professional shorthand, and do not expand an ambiguous word into requirements before confirming what the operator mea |
| `.agents/workflows/pre-development.md:548`            | Prefer a result of about 1,400 words without omitting material decisions and state every meaning or communication decision once.             |
| `.agents/workflows/pre-development.md:697`            | Prefer about 1,400 words per page; preserve material decisions if longer.                                                                    |
| `.agents/workflows/pre-development.md:706`            | Compare two or three viable pairings when no exact family is already mandated, explaining language coverage, readability, character, licensi |
| `.agents/workflows/pre-development.md:727`            | Keep it readable to a person and reusable across scenes.                                                                                     |
| `.agents/workflows/pre-development.md:1004`           | Existing v1 intake stays readable until revised.                                                                                             |
| `.agents/workflows/pre-development.md:1037`           | Prefer about 1,400 words per page without discarding material information, state each decision once, and distinguish facts, proposed behavio |
| `.agents/workflows/pre-development.md:1059`           | Wording changes made during layout work update the owning text in the same change; separately authored HTML must also be synchronized explic |
| `.agents/contracts/artifact-lifecycle.md:3`           | `brief`, model sources, `strategy`, `brand`, `design`, each product Research, and every product-local `product`, `website`, and `marketing-c |
| `.agents/contracts/artifact-lifecycle.md:3`           | Follow `.agents/contracts/document-readability.md`; preserve material evidence and decisions even when longer pages are necessary.           |
| `.agents/contracts/artifact-lifecycle.md:3`           | The artifact records the current status, attributable approval or blocker, and current decisions; chronological interviews, superseded wordi |
| `.agents/contracts/document-confirmation.md:47`       | If a model changes a price, mark affected product materials stale, compare their claims with the model, and edit their derived wording when  |
| `.agents/contracts/document-readability.md:3`         | Strongly prefer one reviewable topic per page, normally readable in five to seven minutes (roughly 1,400 words).                             |
| `.agents/contracts/document-readability.md:3`         | There is no maximum word, line, source, segment, table-row or aggregate-file count.                                                          |
| `.agents/contracts/editorial-pass.md:19`              | Replace abstract or ambiguous wording with the actual actor, action, condition, decision, input, or result when the source supports it.      |
| `.agents/contracts/editorial-pass.md:19`              | Prefer ordinary words and sentences that are natural in the requested language.                                                              |
| `.agents/contracts/editorial-pass.md:19`              | Do not edit source code, machine-readable values, logs, quoted material, legal text, or exact commands unless the task explicitly requires i |
| `.agents/contracts/evidence.md:15`                    | Client wording is not independently verified evidence.                                                                                       |
| `.agents/contracts/pipeline-reconciliation.md:117`    | Changed wording requires that project's review under the document-confirmation contract; synchronization does not renew approval.            |
| `.agents/contracts/product-models.md:30`              | Prefer about 1,400 words per reviewable page, preserving all material information under `.agents/contracts/document-readability.md`.         |
| `.agents/contracts/research-sales-audit.md:11`        | Follow `document-readability.md`: no aggregate or source-count cap.                                                                          |
| `.agents/roles/account-manager.md:25`                 | Keep exact wording only when a paraphrase would change a name or requirement; do not create a quotations section or repeat the same fact.    |
| `.agents/roles/account-manager.md:162`                | Target 500-800 body words for Brief when sufficient; about 1,400 is a preferred review size, not a maximum.                                  |
| `.agents/roles/account-manager.md:175`                | Report the resulting word count and any stale statement replaced.                                                                            |
| `.agents/roles/business-analyst.md:33`                | Prefer about 1,400 words per primary page, readable as one whole topic; preserve material information under `.agents/contracts/document-read |
| `.agents/roles/business-analyst.md:90`                | Return owning files/model IDs, changed facts and sources, preserved processes, unknowns with affected decisions, dependent documents needing |
| `.agents/roles/market-researcher.md:99`               | Prefer about 1,400 words per Research page, never per aggregate corpus.                                                                      |
| `.agents/roles/market-researcher.md:99`               | Preserve material sources, qualifications and segment coverage; use navigable detail pages under `.agents/contracts/document-readability.md` |
| `.agents/roles/market-researcher.md:110`              | Report the resulting word count and any prior finding replaced by fresher evidence.                                                          |
| `.agents/roles/strategist.md:170`                     | Do not treat preservation of prior prose as safety: a rerun that keeps stale or duplicated wording is invalid even when every individual sta |
| `.agents/roles/communication-strategist.md:76`        | Prefer about 1,400 words for shared `brand.md`, preserving material decisions, and avoid restating the strategy.                             |
| `.agents/roles/communication-strategist.md:76`        | Prefer functional current wording over history and caveats.                                                                                  |
| `.agents/roles/brand-designer.md:33`                  | The client can respond in ordinary words; they need not identify a font class, lighting setup or composition technique.                      |
| `.agents/roles/brand-designer.md:33`                  | If no exact typeface is mandated, compare two or three real font pairings with language, readability, character, licensing, and role fit.    |
| `.agents/roles/brand-designer.md:33`                  | After changing a reusable media master, test its exact current wording on at least three different content briefs using the documented refer |
| `.agents/roles/brand-designer.md:33`                  | Produce a usable wordmark or text-name decision, lockups, favicon, and avatar; inspect them at intended sizes and distinguish identity from  |
| `.agents/roles/brand-designer.md:229`                 | The brand is reviewable when its meaning, message, voice, governance, and factual `20-brand` rows are complete; prefer about 1,400 words wit |
| `.agents/roles/brand-designer.md:229`                 | Design is reviewable only after brand approval, all five Brief-owned reference-intake families are confirmed or explicitly excluded and reco |
| `.agents/roles/brand-designer.md:246`                 | Report each changed document's word count.                                                                                                   |
| `.agents/roles/web-designer.md:37`                    | Keep wording in the page's source, make React consume that text, and update separately authored HTML in the same change.                     |
| `.agents/roles/web-designer.md:102`                   | Prefer about 1,400 words for `website.md`, preserving material requirements.                                                                 |
| `.agents/templates/README.md:40`                      | Strongly prefer a five-to-seven-minute review (about 1,400 words) per primary page.                                                          |
| `.agents/templates/README.md:40`                      | This is not a word, line, source, segment or aggregate YAML/corpus cap.                                                                      |
| `.agents/templates/README.md:40`                      | Follow `.agents/contracts/document-readability.md`; completeness takes precedence.                                                           |
| `.agents/templates/README.md:81`                      | Each active product owns Research and a machine-readable Sales process.                                                                      |
| `.agents/templates/brief.md:8`                        | Target 500-800 body words when sufficient; about 1,400 is a preferred review size, never a hard cap.                                         |
| `.agents/templates/brand.md:8`                        | Prefer about 1,400 words per page; preserve material information if longer.                                                                  |
| `.agents/templates/design.md:19`                      | Prefer about 1,400 words per page; preserve material information if longer.                                                                  |
| `.agents/templates/design.md:86`                      | Sizes, line height, spacing, and fallback rules When no exact font is mandated, compare two or three real pairings for language coverage, re |
| `.agents/templates/product.md:9`                      | Prefer about 1,400 words per page; preserve material information if longer.                                                                  |
| `.agents/templates/product-model.md:8`                | Prefer about 1,400 words per page; preserve material information if longer.                                                                  |
| `.agents/templates/product-research-segment.md:11`    | Follow .agents/contracts/research-sales-audit.md and document-readability.md.                                                                |
| `.agents/templates/product-research-competitors.md:9` | Follow research-sales-audit.md and document-readability.md.                                                                                  |
| `.agents/templates/website.md:8`                      | Prefer about 1,400 words per page; preserve material information if longer.                                                                  |
| `.agents/templates/creative.md:8`                     | Prefer about 1,400 words per page; preserve material information if longer.                                                                  |
| `.agents/templates/sales-process.yaml:13`             | Keep each rendered segment preferably around 1,400 words, with no aggregate YAML or segment cap.                                             |
| `.agents/README.md:45`                                | Primary living documents remain operator-readable: preferably about 1,400 words per page (not a hard cap), one current decision per topic, a |
| `apps/studio/workspace/README.md:296`                 | Keep each page's wording in its Markdown source.                                                                                             |
| `apps/studio/workspace/README.md:296`                 | Layout edits that alter wording must update the same Markdown in the same change.                                                            |
| `apps/studio/workspace/README.md:468`                 | After a master prompt changes, regenerate at least three different content briefs with its exact current wording and documented reference in |
| `apps/studio/workspace/README.md:547`                 | Strongly prefer a five-to-seven-minute review per page (about 1,400 words), without a hard word, line, source or segment cap.                |
| `apps/studio/workspace/README.md:596`                 | YAML remains the source of its words; existing React components provide slide layout.                                                        |
| `apps/studio/README.md:150`                           | Each shared document has a readable folder such as `apps/studio/workspace/brand/`, containing `singlepage.md`, and `startup.md`.             |
| `CLAUDE.md:101`                                       | Each active product owns Research and a machine-readable Sales process in its product folder.                                                |
| `CLAUDE.md:101`                                       | Every primary review document appears in the resolved `default` projection and strongly targets a five-to-seven-minute review (about 1,400 w |
| `CLAUDE.md:101`                                       | Preserve material information; split long topics into navigable pages under `.agents/contracts/document-readability.md`.                     |
| `AGENTS.md:82`                                        | Each active product owns Research and a machine-readable Sales process in its product folder.                                                |
| `AGENTS.md:82`                                        | Every primary review document appears in the resolved `default` projection and strongly targets a five-to-seven-minute review (about 1,400 w |
| `AGENTS.md:82`                                        | Preserve material information; split long topics into navigable pages under `.agents/contracts/document-readability.md`.                     |

## Migration and retirement procedures

55 sentences describe one-time procedures for shapes that a synchronized checkout may still carry: Decision Profile, standalone Business, the Evidence register, compact Brief, Strategy and Brand, Sales v1 and the material workspace. Phase 2 moves each procedure to a dated file under `.agents/migrations/` and the check command loads it only when the legacy shape is detected. These are the candidates for the owner's obsolete review: a procedure whose legacy shape no longer exists in any live project can be dropped instead of moved.

| Where                            | Section                              | Sentence                                                                                                                 |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `pipeline-reconciliation.md:26`  | Retiring the former Decision Profile | Do not recreate `knowledge/decision-profile/<layer>.md` or its template.                                                 |
| `pipeline-reconciliation.md:26`  | Retiring the former Decision Profile | If an older checkout still has it, inspect that active layer once during migration.                                      |
| `pipeline-reconciliation.md:26`  | Retiring the former Decision Profile | Move only unique current facts, questions, constraints, sources, and partial client decisions into their owning document |
| `pipeline-reconciliation.md:26`  | Retiring the former Decision Profile | Reusable rules belong in `.agents/`, never in another workspace checklist.                                               |
| `pipeline-reconciliation.md:26`  | Retiring the former Decision Profile | Preserve whole-document approvals in source metadata; profile-only approval rows do not establish approval of a complete |
| `pipeline-reconciliation.md:34`  | Retiring the former Decision Profile | Remove the retired source, template bindings, index entries, `uses` references, and obsolete review fingerprints after r |
| `pipeline-reconciliation.md:34`  | Retiring the former Decision Profile | Preserve remaining semantic dependencies and unresolved impact.                                                          |
| `pipeline-reconciliation.md:34`  | Retiring the former Decision Profile | If an old cursor names `decision-profile`, route it to the earliest affected owning document in `00-business` or a later |
| `pipeline-reconciliation.md:34`  | Retiring the former Decision Profile | Empty startup overrides and atomic product-catalog inheritance remain unchanged.                                         |
| `pipeline-reconciliation.md:43`  | Retiring standalone Business         | Apply `product-models.md` before accepting an old cursor or stage completion.                                            |
| `pipeline-reconciliation.md:43`  | Retiring standalone Business         | Inspect the active layer's old Business, Product Overview, Research, Sales, custom pages and bindings.                   |
| `pipeline-reconciliation.md:43`  | Retiring standalone Business         | Make a section/field transfer map before deleting anything.                                                              |
| `pipeline-reconciliation.md:43`  | Retiring standalone Business         | Brief receives request/authority/initial constraints; Product receives customer/value/offer/acceptance; model sources re |
| `pipeline-reconciliation.md:43`  | Retiring standalone Business         | Unique material, source IDs and uncertainty must survive.                                                                |
| `pipeline-reconciliation.md:43`  | Retiring standalone Business         | Do not automatically split a whole topic across BMC blocks or copy facts into every model.                               |
| `pipeline-reconciliation.md:52`  | Retiring standalone Business         | A later cursor must also return there if initial model membership or client-factual coverage is incomplete; only affecte |
| `pipeline-reconciliation.md:52`  | Retiring standalone Business         | `00-business` remains the stage ID, never a new Business page.                                                           |
| `pipeline-reconciliation.md:52`  | Retiring standalone Business         | V1 catalogs remain readable while content attribution is pending.                                                        |
| `pipeline-reconciliation.md:52`  | Retiring standalone Business         | Upgrade to v2 only after model boundaries are explicitly chosen and sources created.                                     |
| `pipeline-reconciliation.md:52`  | Retiring standalone Business         | Preserve all products and extensions; empty startup stays empty.                                                         |
| `pipeline-reconciliation.md:52`  | Retiring standalone Business         | Remove Business sources, stories, template/index/uses entries and obsolete fingerprints only after the transfer is check |
| `pipeline-reconciliation.md:65`  | Compact Brief migration              | Use the six current Brief template sections.                                                                             |
| `pipeline-reconciliation.md:65`  | Compact Brief migration              | Restore the concise client-supplied business/resource facts formerly replaced by links; do not derive them from later pr |
| `pipeline-reconciliation.md:65`  | Compact Brief migration              | Compaction must preserve all five reference categories and their separately reviewed descriptions, not merely keep file  |
| `pipeline-reconciliation.md:65`  | Compact Brief migration              | Do not discard or restart confirmed visual discovery.                                                                    |
| `pipeline-reconciliation.md:65`  | Compact Brief migration              | Missing per-category analysis is completed from supplied images by the professional owner; the client need not write it. |
| `pipeline-reconciliation.md:65`  | Compact Brief migration              | Preserve exact source and asset IDs, category readiness and unchanged scope confirmation in frontmatter.                 |
| `pipeline-reconciliation.md:65`  | Compact Brief migration              | Discuss contradictions with the operator; retain only a material unresolved discrepancy in source metadata.              |
| `pipeline-reconciliation.md:65`  | Compact Brief migration              | Do not restore the retired quotation, scope-status or unknowns sections to satisfy old headings.                         |
| `pipeline-reconciliation.md:65`  | Compact Brief migration              | Remove Brief's downstream `uses` edges and obsolete snapshots after inspection.                                          |
| `pipeline-reconciliation.md:81`  | Compact Brief migration              | Review downstream impact before consuming it.                                                                            |
| `pipeline-reconciliation.md:81`  | Compact Brief migration              | Pure relocation is not a new business decision; changed value, support, goals or facts can require substantive model, re |
| `pipeline-reconciliation.md:81`  | Compact Brief migration              | Preserve unresolved stale markers and valid partial decisions; never renew document approval during this migration.      |
| `pipeline-reconciliation.md:88`  | Compact Strategy migration           | Strategy uses the five current template sections and owns the project-wide marketing direction: goals, audiences, positi |
| `pipeline-reconciliation.md:88`  | Compact Strategy migration           | Replace an experiment-centric legacy strategy instead of just renaming its headings.                                     |
| `pipeline-reconciliation.md:88`  | Compact Strategy migration           | Preserve current facts and strategic choices.                                                                            |
| `pipeline-reconciliation.md:88`  | Compact Strategy migration           | Keep still-applicable operator-supplied trial limits in their owning product/model sources; do not promote them to ongoi |
| `pipeline-reconciliation.md:88`  | Compact Strategy migration           | Replace roadmap, phased transition, backlog-style “next step”, preparation and configuration prose with one concrete fin |
| `pipeline-reconciliation.md:88`  | Compact Strategy migration           | Keep the actual unfinished deliverables in their product documents or coordinator handoff.                               |
| `pipeline-reconciliation.md:88`  | Compact Strategy migration           | Detailed campaign and business-learning plans belong to product work; engineering tests and runtime verification remain  |
| `pipeline-reconciliation.md:103` | Compact Strategy migration           | Remove a legacy Decision status section after retaining material unresolved decisions beside their owning choice.        |
| `pipeline-reconciliation.md:103` | Compact Strategy migration           | Confirmation and stale state belong to metadata and the Studio badge.                                                    |
| `pipeline-reconciliation.md:103` | Compact Strategy migration           | Move consequential attribution to decision-keyed frontmatter; remove empty blocker tables, downstream-document citations |
| `pipeline-reconciliation.md:103` | Compact Strategy migration           | This does not renew approval.                                                                                            |
| `pipeline-reconciliation.md:194` | Compact Brand migration              | Use the five current Brand template sections.                                                                            |
| `pipeline-reconciliation.md:194` | Compact Brand migration              | Replace Decision status with Brand identity, retaining exact names and brand/product relationships.                      |
| `pipeline-reconciliation.md:194` | Compact Brand migration              | Replace process-heavy Governance with material Consistency rules.                                                        |
| `pipeline-reconciliation.md:194` | Compact Brand migration              | Approval records and source attribution stay in metadata; preserve current meaning, messages, claims and any scoped nami |
| `pipeline-reconciliation.md:194` | Compact Brand migration              | Route old Brand approval anchors to `#intended-perception`.                                                              |
| `pipeline-reconciliation.md:194` | Compact Brand migration              | A changed meaning requires review and cannot inherit an old body approval; valid visual inputs remain in Brief and Asset |
| `pipeline-reconciliation.md:411` | Material workspace compatibility     | At the next invocation, inspect product materials in the owned layer.                                                    |
| `pipeline-reconciliation.md:411` | Material workspace compatibility     | Adopt shared artboard/PNG tools; use shared motion playback/MP4 only when selected.                                      |
| `pipeline-reconciliation.md:411` | Material workspace compatibility     | Content stays optional and free-form.                                                                                    |
| `pipeline-reconciliation.md:411` | Material workspace compatibility     | Preserve source-layer finding namespaces and whole-document confirmations.                                               |
| `pipeline-reconciliation.md:411` | Material workspace compatibility     | Changes to layout utilities alone do not rewrite or reconfirm unchanged business decisions.                              |

## Goldens

Recorded on the phase-1 branch before any change, from the worktree `claude/agents-pipeline-compaction` at the merge of PR #242.

- `npm run studio:validate`: 171 tests across 20 files pass; both workspace layers valid with self-check; editorial-pass and GitHub reconciliation tests pass.
- Resolved workspace snapshot: 182 entries covering both layers, both projections and every review document, stored beside this file as `2026-09-18-pre-development-goldens.txt`. Each line is layer/projection, entry ID, resolution, review state and a 16-character content hash; it is reproduced by loading the workspace with the shared loader and review resolver, so phase 2 can diff against it after every rule move.

| Review state (singlepage layer) | Documents |
| ------------------------------- | --------- |
| `stale`                         | 43        |
| `unconfirmed`                   | 8         |
| `confirmed`                     | 2         |

Only Brief and the shared model are `confirmed`. Strategy, Brand and Design carry confirmation records whose fingerprints no longer match their bodies, and their staleness cascades through every product document. Phase 2 gates must reproduce exactly this picture on the same tree before any rule moves.

Downstream fixtures: the empty startup layer of this repository is the empty fixture and is covered by the snapshot above. A populated downstream fixture with all six shared documents does not exist yet; the validator self-check only covers synthetic merge cases. Phase 2 adds one under `tools/studio/workspace/fixtures/` before the check command is written.

## Decisions needed before phase 2

1. First cycle of the check command in report-only mode or enforcing from day one. Recommendation: report-only.
2. Retired contracts removed without pointer stubs, or five-line pointers kept for one release. Recommendation: remove.
3. Which downstream projects are live, and whether one workspace can be copied for a dry run.
4. Confirm the `.agents/migrations/` folder with dated procedures loaded on detection, replacing migration prose in permanent contracts.
5. Any migration procedure above whose legacy shape no longer exists in a live project can be dropped rather than moved; name them if known.

## Decisions taken

Recorded by the owner on 2026-09-18, before phase 3.

1. Report-only first cycle of the check command (adopted for phase 2).
2. Retired contracts are removed without pointer stubs.
3. `flakecode/m2commerce` is the only live downstream project with a Studio workspace (`default_layer: startup`, Brief confirmed 2026-09-12, Strategy, Brand, Design and a v2 catalog owned by the startup layer). Its workspace may be copied for read-only dry runs; `doctorgpt` and `kultfond` have no `apps/studio` and last changed in May 2026.
4. `.agents/migrations/` holds dated procedures loaded only when the pipeline check detects a legacy shape.
5. All eight migration procedures are removed rather than moved: the framework layer and the m2commerce startup layer carry none of the six detected shapes (empty `knowledge/` and `business/startup/`, catalog v2, every owned Sales file v2, no `ST-EV`/`SP-EV` codes in Markdown or YAML, cursor in the current vocabulary, current Brief, Strategy and Brand headings).

## Phase 3 outcome

Recorded on branch `claude/agents-pipeline-prose` after the rewrite. The section map above is the phase-1 plan. The `phase3` column of the TSV records the per-sentence result derived from the phase-1 disposition, kind and target; the deviations below override it where the plan changed.

### Where the rules ended

| File                                                                                                                                                   | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/workflows/pre-development.md`                                                                                                                 | Rewritten from 10,341 to 2,113 words: entry, the every-invocation loop (preflight, cursor, pipeline check, gap repair, decision-scoped loading), the stage table with cursor transitions, working rules including the single readability paragraph, the change loop, ownership, tool launch and the handoff.                                                                                                                                                                                                                                                                                |
| `.agents/contracts/inheritance.md`                                                                                                                     | New, 1,456 words: layers and projections, layer resolution, workspace and indexes, products and models, design layout, styles and fonts, downstream applicability. Absorbs `context-loading.md`, the inheritance bullets of `artifact-lifecycle.md`, the layer and cross-project Strategy rules of `pipeline-reconciliation.md`, the projection table of `.agents/README.md` and the layer rules of the workflow.                                                                                                                                                                           |
| `.agents/contracts/evidence.md`                                                                                                                        | Rewritten, 1,218 words: claims, unknowns (the one home of the four unknown classes), source ownership, assets (absorbs the asset lifecycle of `artifact-lifecycle.md`), research conduct.                                                                                                                                                                                                                                                                                                                                                                                                   |
| `.agents/contracts/document-confirmation.md`                                                                                                           | Rewritten, 1,269 words: stamp, four states, review edges (from `product-models.md` Dependencies), impact review, layer rules; the stage-gate section reduced to one sentence and the legacy baseline support moved to `github-reconciliation.md`.                                                                                                                                                                                                                                                                                                                                           |
| `.agents/contracts/github-reconciliation.md`                                                                                                           | Layer routing replaced by a pointer to the inheritance contract; otherwise unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `.agents/contracts/editorial-pass.md`, `tool-use.md`                                                                                                   | Unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `artifact-lifecycle.md`, `context-loading.md`, `document-readability.md`, `pipeline-reconciliation.md`, `product-models.md`, `research-sales-audit.md` | Deleted without stubs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `.agents/migrations/README.md`                                                                                                                         | New: what the directory is for and the eight retired procedures with their detectors and the commit that still holds their text (`80bf5cdb14`).                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `.agents/pipeline/pre-development.yaml`                                                                                                                | Only the six `legacy_shapes[].procedure` pointers changed to `migrations/README.md#retired-procedures`; stages, checks and the cursor vocabulary are unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Seven roles                                                                                                                                            | Method, thresholds, a one-line handoff and a one-line editorial pointer; 8,870 to 7,993 words. Inputs restated from the workflow removed (refusal conditions kept in the mission), Capabilities removed because `.agents/tools/catalog.yaml` already names the roles allowed per capability, readability and contract restatements removed. `brand-designer` absorbs the Design intake, media, typography, specimen and layout method of the workflow; `business-analyst` absorbs the segmented Sales method of `product-models.md`; `market-researcher` absorbs `research-sales-audit.md`. |
| `.agents/templates/README.md`                                                                                                                          | Sequence table kept, whole-page ownership table added from `product-models.md`, workflow, readability and confirmation restatements removed.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Templates                                                                                                                                              | Bodies unchanged except four references to removed contracts (`product.md`, `product-research.md`, `product-research-segment.md`, `product-research-competitors.md`).                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `.agents/README.md`                                                                                                                                    | 815 to 405 words: ownership list names the six contracts and `migrations/`; the loading rule is a pointer; the projection table moved to the inheritance contract.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `CLAUDE.md`, `AGENTS.md`                                                                                                                               | The pre-development section is the same 140-word pointer in both files (2,301 to 1,076 and 3,098 to 990 words).                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `.claude/commands/singlepagestartup.md`, `.codex/skills/singlepagestartup/SKILL.md`                                                                    | Point at the workflow and the check command; no contract reference.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `.claude/agents/*.md`, `.codex/agents/*.toml`                                                                                                          | Contract list is inheritance, evidence, document-confirmation and tool-use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `apps/studio/workspace/README.md`                                                                                                                      | 5,099 to 3,929 words: stage restatements, pipeline mechanics, the readability paragraph, the design method paragraph, the Sales field list and the Research audit rules removed; operator content kept with pointers to the owners.                                                                                                                                                                                                                                                                                                                                                         |
| `apps/studio/README.md`                                                                                                                                | 2,102 to 1,719 words: inheritance restatements trimmed to pointers; Document confirmation reduced to the helper command and the contract link.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `tools/studio/presentation/structure.test.ts`, `tools/singlepagestartup/pipeline/check.test.ts`                                                        | Pinned strings retargeted from the workflow to the brand-designer role (whitespace-normalized) and from `contracts/` to `migrations/`; the semantic rewrite stays in phase 4.                                                                                                                                                                                                                                                                                                                                                                                                               |

Words loaded by a typical invocation (workflow, six contracts, one entry file, the command adapter and one role) fall from about 27,700 to about 9,600.

### Deviations from the phase-1 plan

- Migration procedures were deleted, not moved (decision 5). The detectors stay executable and name the history commit instead of a procedure file.
- Templates stay byte-identical except the four reference fixes: the goldens hash template bodies, and a template is loaded only when an artifact is created or repaired, so its 226 sentences, including 9 readability restatements and the intake and interface comments that restate the roles, wait for phase 4, where goldens and tests change together.
- Final editorial pass: every role and the workflow keep a one-line pointer under the heading instead of losing the section, because `tools/agents/editorial-pass.test.mjs` requires the heading and the contract path in every role and workflow. The 15 copies of the boilerplate sentence are gone.
- Capabilities: the tools catalog, not the pipeline definition, is the home of allowed roles per capability; the role sections were removed rather than moved.
- `product-models.md` Dependencies: the review edges are documented in `document-confirmation.md`, next to the states they affect, rather than beside the machine-validated pipeline definition.
- R0445 (Studio sidebar groups) stays in the workspace README as operator documentation instead of the inheritance contract.
- The product-materials paragraph repeated in two role handoffs lives once in the workflow's `40-products` bullet.
- The Codex role adapters keep their one-line instruction to browse only when the task needs current evidence; the `CLAUDE.md` and `AGENTS.md` copies are gone.
- Readability: 61 of the 72 restatements are removed and 2 disappeared with the template reference fixes; the 9 remaining ones sit in unchanged templates and are marked `template:unchanged-until-phase-4` in the TSV.

### Goldens after phase 3

- `npm run studio:validate` passes after every group.
- The pipeline check on the framework layer prints the same report as phase 2: 19 passed, 4 gaps (3 approval, 1 decision), no structural gaps, no legacy shapes, computed cursor `10-strategy`.
- The resolved workspace snapshot differs from `2026-09-18-pre-development-goldens.txt` in exactly 8 of 182 lines: the hashes of `template.product` and `template.product-research` in both layers and both projections, caused by the reference fixes. Every document state, dependency count and business hash is unchanged. The post-phase-3 snapshot is `2026-09-18-pre-development-goldens-phase3.txt` and is the baseline for phases 4 and 5.
- The check against a read-only copy of the m2commerce workspace reports 15 passed, 8 gaps and no legacy shapes, unchanged by the rewrite.
