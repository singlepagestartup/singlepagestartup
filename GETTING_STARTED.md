# Getting started with SinglePageStartup

This is the path from a fresh clone to a running product: what the repository
contains, how to start it, how a business idea becomes approved documents, and
how those documents become working code. Read it once in order; the reference
material it points at goes deeper on each part.

## What is in this repository

Three things live here, and they are easy to confuse because they all look
like code.

**The framework.** `libs/modules` holds business modules — identity and access,
ecommerce, payments, blog, CRM, file storage and the rest. Each entity is a
model with its own REST API in `apps/api` and its own frontend components.
`apps/host` is the Next.js application that serves them. This is what you ship.

**Studio**, under `apps/studio`. Two different things share that directory. Its
`workspace/` holds the living business documents of one project — brief,
strategy, brand, design, products — and Storybook renders them for review. Its
`modules/` holds visual projections of the framework's components, rendered
without any data. The first is where a project is decided; the second is where
a component is judged before it is wired to anything.

**The agent system**, under `.agents` with provider adapters in `.claude` and
`.codex`. It holds the workflows, professional roles, contracts and templates
that AI agents follow. It is provider-neutral: Claude Code and Codex read the
same definitions.

You can use the framework without the other two. The rest of this guide assumes
you want all three, because together they are the point.

## Install and run

Node.js ^24, npm ^11, Bun ^1.2.3, Docker and Docker Compose are required.

```bash
npm install
```

```bash
./up.sh
```

`up.sh` creates the environment files, starts Postgres and Redis in Docker and
runs the database migrations. Add `npx nx run api:db:seed` if you want the
example data.

```bash
npm run api:dev
```

```bash
npm run host:dev
```

Only if you intend to use the AI workflows, run the agent setup separately:

```bash
./ai.sh
```

It installs the command-line tools the workflows need, authenticates the GitHub
CLI and creates `.agents/.env` with your GitHub Project configuration. That file
sits beside the shared agent definitions rather than in a provider directory,
because the same configuration serves Claude Code, Codex and anything else you
use. `ai.sh` has nothing to do with running the application, so it can wait
until you need it.

## Your layer

Every business document exists twice: a `singlepage` file owned by this
framework repository, and a `startup` file owned by your project. You write the
`startup` side. An empty `startup` file inherits the framework's content as
reference; as soon as you write something, yours wins. `default` is the
resolved result of the two and is never edited directly.

This is what makes the framework's own business documents useful to you: they
are a worked example you can read, not a template you must delete.
`.agents/contracts/inheritance.md` defines exactly how the layers resolve.

## Define the business

```bash
/singlepagestartup
```

In Codex it is `singlepagestartup`; plain language works too. The workflow
writes into `apps/studio/workspace` and moves through five stages. Each stage
has owning professional roles, executable checks and documents that only you
can approve.

**`00-business` — Client Request.** The Brief: which products exist, who they
are for, what the business currently is, what resources and constraints are
real, what the goals are, and what visual material you already have. Alongside
it the first product descriptions, the shared operations-and-economics model
and the sales intake. Nothing here is invented: it records what you said, what
supplied material shows, and what is explicitly unknown.

**`10-strategy` — Strategy.** Each product gets its Research first: the market
question, the alternatives, what the evidence supports and what it does not.
Then Strategy describes one concrete target state of the whole project — the
audiences, the role of each product, the channels, the customer journey and the
measurable outcomes. It is the finished picture, not a roadmap to it.

**`20-brand` — Brand.** The meaning that should form in the customer's mind:
the intended perception, the message hierarchy, the objections and the answers
to them, the voice. Colors, type and layout are not here; they come next.

**`30-design` — Design.** The visual translation of the approved Brand: the
client preference profile, the semantic colors, typography bound to registered
font assets, the interface language with rendered specimens, and the
photography and illustration systems with their master prompts. Generated
assets are registered with their rights and provenance.

**`40-products` — Products.** For each active product: the Product document,
the complete Sales process per customer segment, the promotional materials
(website specification, marketing creative, presentation) and Analytics. This
is a prospective business plan and the requirements engineering will implement.

Two mechanisms run underneath all five. `npm run singlepagestartup:pipeline:check -- --format text`
prints which stage is complete, which gaps remain and why. And every review
document carries a confirmation stamp recorded against the exact text you
approved: change the text and the stamp becomes invalid, which is how the
system refuses to treat an old approval as covering new content.

## Build it

```bash
/core/next
```

This is the engineering cycle, one issue at a time. It reads the issue's status
in your GitHub Project and runs the right phase, so you normally call only this
command:

- **`00-create`** turns a need into an issue.
- **`10-research`** studies the codebase and records what exists.
- **`20-plan`** writes the implementation plan.
- **`30-implement`** makes the change.

Research and plan are reviewed by a human before the next phase starts; you
advance the issue's status yourself when you are satisfied.

Implementation does not go straight into `libs/modules`. An approved page is
first split into blocks projected in `apps/studio/modules`, judged in Storybook
with whatever data you supply, and only then implemented against real data from
`apps/api`. `.agents/workflows/design-to-implementation.md` owns that order and
explains why skipping it is expensive.

## Where to look next

| Question                           | File                                         |
| ---------------------------------- | -------------------------------------------- |
| How the architecture works         | `README.md`                                  |
| How agents are organized           | `.agents/README.md`                          |
| Entry point for any AI agent       | `AGENTS.md`, or `CLAUDE.md` for Claude Code  |
| How layers and projections resolve | `.agents/contracts/inheritance.md`           |
| How approval and review state work | `.agents/contracts/document-confirmation.md` |
| What Studio renders and exports    | `apps/studio/README.md`                      |
| What each workspace document holds | `apps/studio/workspace/README.md`            |
| A specific module                  | `libs/modules/<module>/README.md`            |

## Licence

MIT. Use it, change it, ship it, sell what you build with it. Keep the
copyright and permission notice with the code, and accept that it comes with no
warranty.
