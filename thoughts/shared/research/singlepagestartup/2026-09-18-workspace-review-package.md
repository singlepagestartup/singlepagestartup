---
date: 2026-09-18
researcher: rogwild
branch: claude/agents-pipeline-close
topic: "What to read in the framework workspace after clearing the confirmation chain"
tags: [studio, workspace, confirmation, review]
status: awaiting owner review
---

# Review package: the framework workspace after the confirmation chain

This exists because the confirmations recorded on 2026-09-18 were answered
quickly in chat, not read closely. The operator said so: reviewing means
reading the text, and the text was never put in front of them. This document
puts it there.

Everything below is on `claude/agents-pipeline-close`, unmerged. Nothing here
asks for a decision inside this file; read, then say what is wrong.

## Read in this order

1. **Brief**, `apps/studio/workspace/brief/singlepage.md` — the root. Every
   other change follows from it.
2. **Operations & Economics**, `products/singlepage/models/framework-service/model.md`.
3. **Code Framework Product**, `products/singlepage/singlepagestartup/product.md`.
4. The three Code Framework promotional materials, if the open decision in
   section 5 matters to you now.

Strategy, Brand, AI Chat Product, AI Chat Sales and Design have unchanged
bodies. They carry new stamps only because the old fingerprints were wrong.
Reading them is optional; reading the Brief is not.

In Storybook: `Workspace / 00 Client Request / 01 Brief`, then
`Workspace / 40 Products / singlepage`.

## 1. Brief: what changed in the body

### Customers and value, first paragraph

Before:

> AI Chat is intended for people who bring their own business facts and
> documents, configure knowledge for their business and ask questions. Each
> chat is intended to have a separately scoped vector knowledge base; retrieval
> supplies relevant context for its answers. The desired value is useful
> answers and advice grounded in that person's business data. Better answer
> quality than ordinary ChatGPT without that context is a goal to test.

After:

> AI Chat is intended for people with a business idea or early-stage project
> whose material is scattered across notes, documents, screenshots and partial
> decisions. They supply what they already have or answer guided questions; the
> service organizes it into a reviewable project model, shows what is missing
> or contradictory, and keeps the accepted result available for later
> questions, criticism and materials. The first setup session is intended to
> take about one focused hour, with unresolved questions left open. The same
> decisions assemble a landing page from SinglePageStartup blocks, edited in a
> private sandbox with an immediate preview and no public address. The desired
> value is a usable project model and a first page that can reach real
> customers; better answer quality than a general chat without that context is
> a goal to test.

**What to check:** the per-chat vector knowledge base is gone from the value
statement. The AI Chat Product still says the implementation indexes the
project page for retrieval, and Brand still tells the interface not to explain
retrieval to customers. If the separately scoped knowledge base per chat is
still a real product decision, this paragraph dropped it.

### Business and resources, Path to building

Before:

> After a positive AI Chat experience, the intended visible button **Развернуть
> проект на своей машине** leads to GitHub. Interested users deploy the project
> locally with a coding agent, explore and adapt it, then reuse SinglePageStartup
> for their next products.

After:

> When the landing page is ready, the intended action **Publish on my server**
> authenticates the user with GitHub, creates the project repository in their
> account, accepts a deployment key for a hosting provider such as Beget or
> Timeweb, and configures automatic deployment from that repository. This path
> needs no token purchase. A maker with another concrete software need reuses
> the same framework with a coding agent.

### Business and resources, three new rows

> **AI Chat access** — Email-and-password registration and login; Google and
> other social sign-in are not planned. Registration grants the currently
> available free token allowance.

> **Payments** — Accepted in Russia through an online cash register. The
> payment-accepting party's legal name and payment details are not recorded yet.

> **Data retention** — Account deletion removes the active account and the
> project data the service controls. Infrastructure-provider backups may retain
> copies for up to six months under the provider's own process.

### Business and resources, Support

Before:

> Help and maintenance as time permits, without a guaranteed support schedule.

After:

> AI Chat support requests are processed within 24 hours as the initial service
> level, without continuous live coverage or a resolution deadline. Help with
> the free framework code stays best-effort, as time permits.

### Brief metadata

`intake.product_direction` records the direction decision and what it
supersedes. `sources.service_terms` records the seven terms. The 2026-09-13
records for the old flow were rewritten to point at the new one rather than
left beside it.

## 2. Operations & Economics: four corrections

| Where            | Before                                                                                     | After                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model scope      | AI Chat "will provide business-specific answers as a hosted service"                       | organizes supplied material into a reviewable project model, keeps it as context, carries a landing page to the customer's server                                                   |
| Model scope      | makers reach the foundation by obtaining it "through GitHub and build with a coding agent" | publishing a page creates the customer's repository; GitHub and an agent is the route for another software need                                                                     |
| Key Partnerships | "No partnership agreement or dedicated supplier terms are specified"                       | adds payments in Russia through an online cash register and the customer-connected server with Beget or Timeweb as examples; AI, storage and infrastructure providers still unnamed |
| `capacity` rule  | "support has no guaranteed schedule"                                                       | 24 hours for hosted AI Chat, best-effort for the free framework code                                                                                                                |

Revenue Streams, Key Resources, Cost Structure and Funding are unchanged.

## 3. Code Framework Product: one paragraph

Before:

> Interested makers follow **Run the project on your machine** to GitHub and ask
> a coding agent to deploy and adapt the project.

After:

> Publishing a page from AI Chat creates the customer's repository on this
> foundation; a maker with another concrete software need instead follows **Run
> the project on your machine** to GitHub and asks a coding agent to deploy and
> adapt the project.

## 4. Confirmations recorded on 2026-09-18

Six documents were stamped today: Brief, the shared model, AI Chat Product,
AI Chat Sales, Strategy and Brand. Each stamp records a real answer in chat,
and each was verified against the committed body after the commit hooks ran.

They rest on a quick yes rather than a close reading. That is the honest
record, and it is why this package exists. If the reading changes anything, the
stamp moves with it; nothing downstream depends on these approvals being final.

## 5. What is not decided

**No material addresses the `developer-agents` segment.** Code Framework Sales
defines two segments. `makers` has a website path, five creatives and a full
slide deck. `developer-agents`, a coding agent selecting the foundation for the
person it works for, has no page path, no creative and no slide. Its recorded
needs are clear instructions, a visible separation of shared conventions from
the human's product choices, and enough material to explain fit and remaining
work to the responsible person.

This was found by performing the review that three `review.stale` markers asked
for. The markers are cleared because the review is done; the gap is recorded in
each of the three documents as an open decision. Whether that segment is served
by the website, by repository documentation, or not yet at all, is yours to
decide.

**Four business decisions remain open** in AI Chat Sales, unchanged and
correctly recorded as blockers: token unit and price terms, the
payment-accepting party's legal details and the Russian receipt flow, the
selected AI/storage/infrastructure providers, and the GitHub authorization
scope with deployment-credential handling.

## 6. Five documents still awaiting your reading

These keep an invalid stamp on purpose. Their bodies are unchanged and carry no
superseded statement; they were never put in front of you, so they are not
marked confirmed.

- `product.ai-chat.website`
- `product.ai-chat.page.website.landing`
- `product.ai-chat.page.website.project-workspace`
- `product.ai-chat.page.content.one-hour-setup`
- `product.ai-chat.page.content.project-model`

## State of the workspace

- No document resolves as `stale`. Every recorded input snapshot was refreshed
  after its impact review.
- 9 confirmed, 5 with an invalid stamp awaiting reading, 39 never confirmed
  (ordinary drafts).
- The pipeline reports 23 passed and 1 gap: Client Request, Strategy, Brand and
  Design are complete, and the remaining gap is the four business decisions.
