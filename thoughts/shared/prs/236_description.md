## Summary

Shared changes can merge cleanly while leaving incompatible assumptions in child-owned code and documents. Retiring Evidence exposed this problem: some document references lost the meaning of the underlying fact or approval.

This PR preserves adaptation intent in commit messages and adds a separately requested `adapt-upstream` command. Git synchronization and normal agent startup remain independent of adaptation and agent availability. It also restores concise source context in the framework's Studio documents.

## Changes

- Require downstream impact, rationale, applicability, actions, and verification in agent-created commit messages; retain these instructions when preparing PR descriptions and authorized squash commits.
- Add provider-neutral adaptation rules and thin Codex/Claude adapters for reviewing already integrated local Git history and updating child-owned sources.
- Add an offline Git helper with message validation, legacy-commit review, temporary reports, and checkout-local completion cursors. Reject stale/incomplete reviews, uncommitted adaptations, and shallow history; disable Git transports and lazy fetching.
- Keep adaptation explicit: no migration hooks, automatic startup checks, fetches, merges, pushes, or dependency downloads.
- Expand source and approval descriptions in Brief, Business, Strategy, Brand, and Design; preserve client facts, confirmation history, unresolved review states, and startup inheritance.

## Verification

- [x] `npm run adapt-upstream:test` — 13 scenarios pass, including offline checks, legacy history, merge parents, branch/worktree isolation, and checkpoint validation.
- [x] `npm run studio:presentation:test` — 95 tests and 453 assertions pass.
- [x] `git diff origin/main...HEAD --check` — passes.
- [x] Validate the implementation commit migration messages and verify that commit hooks introduced no semantic changes.

## Downstream migration

Applies to child projects adopting these workflows or retaining opaque references after Evidence retirement.

1. Keep the existing Git synchronization process. Request `adapt-upstream` separately when ready to review locally integrated changes; preserve project-specific agent settings.
2. Review legacy commits and relevant child-owned frontend, backend, configuration, and document contracts. An absent migration block does not establish compatibility.
3. Scan owned Brief, Business, Strategy, Brand, Design, nested product Markdown/YAML, and bindings for obsolete Evidence paths or row IDs such as `ST-EV-*` and `SP-EV-*`. Recover material meanings from that child's attributable history and replace opaque references with short explanations retaining source, date, scope, and limits.
4. Preserve client facts, unknowns, valid Research/asset references, approval history, and inheritance. Framework business facts and reconciliation outcomes are examples, not client input. Do not renew confirmation hashes to hide changed or stale content.
5. Run affected project checks and acknowledge adaptation only after the reviewed changes are committed and verified.

## Notes

Missing local history or tooling leaves adaptation pending without blocking Git operations. The helper validates review completeness; semantic applicability remains the agent's responsibility. Cherry-pick/squash imports require inspecting their original source range because ancestry alone may omit it. No child project is modified by this PR.

Migration trailers are present in the implementation commits. Preserve the consolidated migration instructions in the final Git message if this PR is squashed.
