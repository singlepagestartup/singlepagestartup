# Code Placement Contract

The repository has a settled shape. A new file goes where its **kind** already
lives, not next to whatever happens to call it. Placement is part of the change,
reviewed like the code itself.

## Decide by kind, not by caller

Before creating a file, name what it is. The kind decides the directory.

| The file is                                              | It belongs in                                                           |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| A constant or a literal shared beyond one call site      | `libs/shared/utils/src/lib/constants`                                   |
| A pure predicate or value helper, backend                | `libs/shared/backend/utils/src/lib/<name>/`                             |
| A pure helper, frontend                                  | `libs/shared/frontend/**`                                               |
| A request or response helper for the API boundary        | `libs/shared/backend/api/src/lib/<name>/`                               |
| A service operation, with dependencies and a constructor | beside the model's other services                                       |
| Route middleware                                         | the module's `backend/app/middlewares/src/lib/*`                        |
| A UI variant                                             | its own folder under `frontend/component/src/lib/singlepage/<variant>/` |
| A one-off analysis run once                              | the session scratchpad, never the repository                            |
| An analysis worth running again                          | `tools/`, as a maintained target with tests                             |

A folder whose siblings are all services is a statement that services live
there. A constant or a predicate placed among them reads as a service to the
next person, and that misreading is the cost being avoided.

## Test the placement before writing

Two questions, both answered by looking rather than guessing:

1. **What do the siblings look like?** List the target directory. If every
   neighbour is a different kind of thing from what is being added, the
   directory is wrong.
2. **Does a package already own this kind?** Search for an existing home before
   creating one. A second place for the same kind of code is worse than an
   imperfect first place.

## A thing that grew past one file becomes a folder

When one file is no longer enough for a thing — a service that gained a second
service beside it, a component that gained its own helpers — the whole thing
moves into a folder named after it, and the original file becomes that folder's
`index.ts`. Importers do not change: `./authentication/oauth` resolves to the
folder's `index.ts` exactly as it resolved to `oauth.ts`.

What must never exist is both at once:

```
authentication/
├── ethereum-virtual-machine.ts    ← one service
└── ethereum-virtual-machine/      ← two more services
```

The name now points at two places, and a reader looking for the flow finds half
of it. Adding a file beside a folder of the same name, or a folder beside such a
file, is not a smaller step than moving the file in — it is the step that splits
the thing.

## One folder, one kind

A folder of services holds services. Where a flow's services need free
functions of their own, collect them in a single `utils.ts` beside them rather
than adding a file per function: one more file among `callback.ts`,
`exchange.ts` and `start.ts` reads as one more service until it is opened.

Keep such helpers next to the flow when only that flow uses them. Move them to a
shared package when a second module imports them, not before — a helper that
knows the shape of one flow is not general just because it is small.

## Stay inside the existing layers

Do not introduce a new top-level directory, a new layer inside a module, or a
new shared package to hold a change. The layers — `models/<model>`,
`relations/<relation>`, each with `backend`, `frontend` and `sdk`, over the
`libs/shared/*` packages — carry the inheritance rules that every project
depends on, so a new seam is a change to the framework's shape.

Where nothing fits, that is a finding to raise, not a gap to fill silently. Say
what was needed, what was considered, and why each existing home was wrong.
Proceed only once the person has agreed, and record the reason in the commit
message so the exception is visible later.

## Naming follows the same rule

A name is read before the file is opened, so it must not suggest a kind the file
is not. Prefer the name of the thing the file acts on over a general verb, and
avoid a word the repository already uses for something else — `project` means a
workspace project, an Nx project and a GitHub project here, so it cannot also
mean a projection.

## Checking the tree

`node tools/agents/code-placement.mjs` reports the part of this contract a tree
can answer on its own: a source file sitting beside a folder of the same name.
It exits non-zero when it finds one, so it can gate a change. The rest of the
contract is a judgement about kind, which a reader makes.

## Anti-Patterns

- Placing a constant, a predicate or a schema among a model's services because
  a service imports it.
- Placing a helper among REST handlers because the handlers call it.
- Creating a component folder beside real UI variants for a fragment used by one
  form, instead of keeping the fragment in that form.
- Adding a second home for a kind of code that already has one.
- Mixing free functions into a folder of services as one file per function,
  instead of collecting them in a single `utils.ts` beside them.
- Leaving a file beside a folder of the same name, so the thing lives in two
  places under one name; move the file in as the folder's `index.ts`.
- Introducing a new layer or top-level directory without raising it first.
