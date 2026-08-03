# Living artifact contract

- Canonical project state lives in the indexed Markdown, YAML, and asset files.
- Git provides change history and rollback. Do not create release versions,
  snapshots, run journals, recovery stores, resolved copies, or a second editable
  artifact set.
- Progress is derived from required sections, evidence, and dependencies rather
  than a workflow status file.
- Edit the earliest artifact that owns a changed fact or decision, then compute
  and review reverse dependencies.
- Keep one current decision per topic. Replace or amend stale content instead of
  appending session transcripts.
- Templates define structure; roles define professional judgment; workflows
  define order. Do not duplicate any of those concerns inside an artifact.
- Assets remain files referenced by `assets/index.yaml`. Reuse or deliberately
  replace them through that index rather than generating disconnected copies.
