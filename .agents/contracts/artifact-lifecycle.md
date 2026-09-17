# Living artifact contract

- Canonical project state lives in the indexed Markdown, YAML, and asset files.
- AI methods and stage checks live in `.agents/`. Project facts, questions,
  constraints, and sources live in their owning workspace documents; do not
  maintain a separate decision checklist or approval summary.
- The layer-local `apps/studio/workspace/utils/pre-development/<layer>.yaml` stores
  only the resumable workflow cursor. It never stores business decisions or
  resolved artifact copies and is reconciled against the canonical artifacts at
  every launch.
- After reading that cursor, reconcile the current Workspace against the current
  checked-out pre-development workflow, templates, roles, contracts, index, and
  completion rules using `.agents/contracts/pipeline-reconciliation.md`. Run the
  comparison every time instead of storing a pipeline version or migration log.
  Route missing files, sections, schema keys, and requirements to the earliest
  owning stage before normal work resumes.
- Editable living sources remain under
  `apps/studio/workspace/<artifact>/<layer>.<md|yaml>`;
  `apps/studio/workspace/utils/index/<layer>.yaml` points to them and remains the
  artifact graph. Shared components, stories, and technical helpers live in
  `workspace/utils/`; `assets/`, `products/`, and `styles/` stay at the workspace
  root. Product React entry points and YAML remain with their Markdown.
- Singlepage living artifacts describe the actual SinglePageStartup project.
  Startup living artifacts begin as zero-content files and contain only
  project-specific additions and overrides; consumers read their in-memory
  resolved projection.
- Git provides change history and rollback. Do not create release versions,
  snapshots, run journals, recovery stores, resolved copies, or a second editable
  artifact set.
- The active workspace is not a provenance archive. When a generated proposal
  is rejected, withdrawn, superseded, or invalidated, remove its generated files
  and asset-registry entries in the same change. Remove its detailed design from
  the living artifact as well. Git preserves committed history; an uncommitted
  rejected output is discarded rather than archived beside current assets.
- Before cleanup, record the current constraint in the owning document using
  the exact statement `The operator rejected visual proposal <proposal_id>.`
  with the proposal ID in backticks. A proposal ID recorded as rejected can
  never remain current or be reused.
- Before removing an asset, resolve the exact registry entry and path, confirm
  `source_type: generated`, keep the path inside the active workspace asset
  tree, and verify that no current proposed or approved artifact references it.
  Never apply this automatic cleanup to `client`, `stock`, or
  `public-reference` inputs. If provenance, ownership, path, or current use is
  ambiguous, stop and ask the operator instead of deleting.
- Stage completion is derived from required sections, evidence, dependencies,
  and material unresolved questions in their owning documents; the workflow state records the last
  reconciled `00`, `10`, `20`, `30`, or `40` cursor so a fresh model context can
  resume deterministically.
- Quality and decision correctness take precedence over response length, number
  of turns, execution time, or token use. Never skip a material question,
  research step, specialist review, or correction to make the workflow shorter.
- Primary review documents are written for an operator, not for the workflow.
  `brief`, model sources, `strategy`, `brand`, `design`, each product Research, and every
  product-local `product`, `website`, and `marketing-creative` document must
  strongly target a five-to-seven-minute review per page (about 1,400 words).
  This is a preference, never a completeness gate or aggregate source limit.
  Follow `.agents/contracts/document-readability.md`; preserve material evidence
  and decisions even when longer pages are necessary.
  The asset index is a reference register rather than linear reading;
  it keeps only current material rows and concise limitations.
- Edit the earliest artifact that owns a changed fact or decision, then compute
  and review reverse dependencies.
- Before every pre-development invocation, run the GitHub reconciliation
  contract without selecting a layer in the caller. Use its repository-derived
  layer for the ledger, state and living sources. Treat matching
  committed paths as review triggers, record every inspected relevant commit as
  `material` or `no-material-effect`, and apply dependency and approval side
  effects before normal stage work.
- A synchronized shared-pipeline change is effective on the next invocation in
  the framework and every downstream project. Existing artifacts are never
  grandfathered onto an obsolete shape: applicable inheritance may remain, but
  missing project-specific content cannot be satisfied by unrelated inherited
  SinglePageStartup prose.
- During initial interview, keep partial facts in the brief. Do not regenerate all downstream artifacts after every
  answer. Propagate once the decision scope or corrected upstream section is
  stable.
- Keep one current decision per topic. Replace or amend stale content instead of
  appending session transcripts.
- Before saving an updated document, find every earlier statement about each
  changed fact and replace or remove it in the same edit. Never append a new
  answer below a contradictory or obsolete answer. State the decision once; keep only the material source attribution
  and limits beside its owning statement.
- A full professional-artifact regeneration is a replacement projection from
  its stable upstream dependencies. Start from that artifact's template and
  replace the prior body; do not use the prior body as generation input. Git is
  the history. Preserve a prior decision only when its owning upstream artifact
  still states it and the new professional review selects it again.
- Document confirmation is owned by source metadata under
  `.agents/contracts/document-confirmation.md`; the UI and agent loader resolve
  its content fingerprint and source layer identically.
- Keep approval state current and compact. The artifact records the current
  status, attributable approval or blocker, and current decisions; chronological
  interviews, superseded wording, and invalidation history belong to Git;
  coordinator handoffs belong in the workflow response.
- Keep proposed, approved, and stale meaning explicit. A professional proposal
  is not an approved upstream dependency. When a confirmed correction changes
  its premise, treat every contradicted downstream artifact as stale, move the
  cursor to the earliest affected stage, and do not consume stale content until
  its owner has reconciled it.
- Do not grandfather existing prose. Missing explicit scope, strategy, or brand
  approval makes the corresponding stage incomplete even when the cursor had
  previously advanced.
- A completed heading or fluent generic prose is not a completed artifact.
  Resolve facts needed for the current decision, record required user approval
  in its source, and leave unresolved questions and justified inapplicability
  explicit in their owning documents. An assumption cannot answer an
  operator-controlled fact.
- Templates under `.agents/templates/` define structure; consolidated roles
  under `.agents/roles/` define professional judgment; workflows define order.
  Do not duplicate any of those concerns inside an artifact.
- Artifact usability is part of stage completion. An artifact fails its gate
  when it repeats the same decision across multiple sections, exceeds an
  artifact-specific size boundary, adds workflow-owned sections, or preserves
  session history instead of the current decision projection, even when its
  claims and citations are individually correct.
- The operator reviews the complete resolved `default` projection, not an automated prose
  validator. The owning agent must report the document word count, the decisions
  replaced, and any unresolved contradiction in its handoff.
- Assets remain files referenced by the indexed, colocated `assets/<layer>.yaml`
  registry. Physical files are layer-owned: accepted inputs live below
  `assets/<layer>/intake/`, and generated outputs live below
  `assets/<layer>/generated/`. Reuse or deliberately replace them through that
  registry rather than generating disconnected copies. Generated entries use only
  `lifecycle: proposed` or `lifecycle: approved`; never retain a retired state.
  Every current generated entry carries the same stable `proposal_id` declared
  by `Visual proposal ID` in the living design artifact and lives below
  `assets/<layer>/generated/<proposal_id>/`. Before handoff, reconcile Design
  design references, registry entries, and the complete generated asset tree in both
  directions so no registered path is missing, no output is orphaned, and no
  stale brand asset reference survives.
- Presentation source is semantic HTML rendered by presentation-only React
  stories inside the owning product folder in Studio. Never generate slide
  pages as raster images. PDF and PNG
  are deterministic derivatives of the rendered HTML and are never canonical
  project knowledge, attributed sources, registered brand assets, or editable design
  sources.
- Product catalogs resolve atomically. Empty startup inherits the entire
  singlepage catalog; a startup catalog with one or more products replaces it
  completely. Every active product owns its Research, Sales, Product, Analytics,
  Website, Marketing Creative, and Presentation files in one layer. Studio groups
  the three promotional materials and the two evidence views without merging their
  canonical sources. Never mix product folders or
  partially inherit a singlepage product into a startup catalog.
- Presentation export resolves the repository layer through the same canonical
  repository map as the workspace loader. It writes derivatives only below
  `apps/studio/output/<singlepage|startup>/`; a caller assertion that conflicts
  with repository identity must stop the export. Derived output is gitignored
  and may be replaced on the next export without changing living artifacts.
