---
id: design-to-implementation
description: The build order from an approved product page to a working module, and why the Studio stage exists between them.
---

# From a designed page to a working module

Pre-development ends with an approved product and its website specification.
Engineering does not implement that page directly in `libs/modules`. Work
passes through three places in a fixed order, and each one answers a different
question.

## 1. `apps/studio/workspace` — finish the idea

The page is drafted under
`products/<layer>/<product>/website`, from whatever blocks, components and
styles are easiest for the author. Tailwind is not required here and neither is
any component from the framework. The output is a page that shows what the
product should be, not markup anyone will ship.

## 2. `apps/studio/modules` — see it before it works

The approved page is split into elements, components and widgets, and each one
is matched to a block in `apps/studio/modules`. That directory mirrors
`libs/modules`: every component and model described there should have a
projection here, at
`apps/studio/modules/<module>/<models|relations>/<entity>/<layer>/<variant>/`.

Storybook renders these blocks with whatever data the author supplies. Nothing
has to be fetched, no endpoint has to exist and no model has to be wired, so
appearance, states and behaviour can be judged immediately and corrected while
correcting is cheap.

## 3. `libs/modules` — connect it to real data

Only a block that has been seen and accepted in Storybook moves into
`libs/modules`. Data stops being optional there: it comes from `apps/api`
through the SDK providers. Hardcoding it is a bad path even where it happens,
and the model, its API surface and any logic in `apps/api` are finished at this
step.

## Why the middle stage exists

Carrying a Studio page straight into `libs/modules` mixes two kinds of mistake.
A wrong component and a wrong data path then have to be told apart by checking
the whole stack: every call, where each value comes from, how it behaves under
real state. That verification is slow and costs a great deal of AI token
budget, and at the design stage it answers a question nobody asked. Studio
keeps design mistakes where they are cheap to find, so only integration
questions reach `libs/modules`.

## Current coverage

`apps/studio/modules` projects 7 of the 16 modules in `libs/modules`: `blog`,
`crm`, `ecommerce`, `host`, `rbac`, `social` and `website-builder`. The other
nine — `agent`, `analytic`, `billing`, `broadcast`, `file-storage`,
`knowledge`, `notification`, `startup` and `telegram` — have no Studio
projection yet, so work touching them has no visual stage to pass through. The
rule is that they should have one; the gap is recorded here rather than implied
by its absence.

## Final editorial pass

When the work contains prose intended for a person, apply
`.agents/contracts/editorial-pass.md` as the last content-editing step.
