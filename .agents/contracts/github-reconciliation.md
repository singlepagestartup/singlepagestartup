# GitHub reconciliation

Remote comparison is an optional diagnostic, run when the operator requests it
or a task requires inspecting published changes:

```bash
npm run singlepagestartup:github:check
```

It is not a prerequisite for opening Studio or running `singlepagestartup`.
A network failure leaves remote status unknown and local work available. Never
interpret an unavailable fetch as evidence that the remote has no changes.
The checker resolves the active layer itself; `--layer` only asserts that result.
Do not fetch, merge or change branches just to resume a business section.

## Baseline and ledger

Layer configuration and reviewed commits remain in
`apps/studio/workspace/utils/pre-development/github/<layer>.yaml`.
The checker discovers the first published commit containing a nonempty
Strategy document. Before that point,
`waiting-for-baseline` means comparison is not yet active. Each relevant commit
absent from the ledger remains available for inspection. Ignore workflow-only
paths so ledger changes cannot trigger themselves.

Inspect published snapshots without overwriting local work. A matching path
suggests something to inspect; it does not establish a changed business fact.
Record `no-material-effect` with a concrete reason when applicable. For a
`material` change, name the affected fact or decision, update only the requested
owning sources, and record unresolved consequences with specific reasons.
Keep a commit pending while its required reconciliation work is incomplete.
Record completed work with the commit SHA and affected artifact IDs.

Follow `.agents/contracts/document-confirmation.md`: review notices are local
and advisory. A changed GitHub file does not move the saved section or
trigger recursive rewriting of business documents.
Framework work updates `singlepage`; downstream work updates `startup`.
