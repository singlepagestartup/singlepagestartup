# Living artifact contract

- Canonical project state lives in the indexed Markdown, YAML, and asset files.
- Each layer owns an indexed `knowledge/decision-profile/<layer>.md` source. It
  is project-specific routing knowledge: empty startup inherits singlepage and
  meaningful startup content replaces the profile as one domain-specific unit.
- The layer-local `apps/studio/workspace/pre-development/<layer>.yaml` stores
  only the resumable workflow cursor. It never stores business decisions or
  resolved artifact copies and is reconciled against the canonical artifacts at
  every launch.
- Editable living sources are colocated with their Studio stories under
  `apps/studio/workspace/<artifact>/<layer>.<md|yaml>`;
  `apps/studio/workspace/index/<layer>.yaml` points to them and remains the
  artifact graph.
- Singlepage living artifacts describe the actual SinglePageStartup project.
  Startup living artifacts begin as zero-content files and contain only
  project-specific additions and overrides; consumers read their in-memory
  resolved projection.
- Git provides change history and rollback. Do not create release versions,
  snapshots, run journals, recovery stores, resolved copies, or a second editable
  artifact set.
- Stage completion is derived from required sections, evidence, dependencies,
  and the assigned decision-profile rows; the workflow state records the last
  reconciled `00`, `10`, `20`, or `30` cursor so a fresh model context can
  resume deterministically.
- Edit the earliest artifact that owns a changed fact or decision, then compute
  and review reverse dependencies.
- Keep one current decision per topic. Replace or amend stale content instead of
  appending session transcripts.
- A completed heading or fluent generic prose is not a completed artifact. Every
  material profile row must be answered in its owning artifact, explicitly
  blocked, or marked not applicable with a reason.
- Templates under `.agents/templates/` define structure; consolidated roles
  under `.agents/roles/` define professional judgment; workflows define order.
  Do not duplicate any of those concerns inside an artifact.
- Assets remain files referenced by the indexed, colocated `assets/<layer>.yaml`
  registry. Reuse or deliberately replace them through that registry rather
  than generating disconnected copies.
