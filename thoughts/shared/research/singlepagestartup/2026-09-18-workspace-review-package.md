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
3. **AI Chat Product**, `products/singlepage/ai-chat/product.md` — one
   sentence, the implementation of retrieval.
4. **Code Framework Product**, `products/singlepage/singlepagestartup/product.md`.
5. The AI Chat research summary and its competitors page, for the competitor
   figure the selling point rests on.
6. The three Code Framework promotional materials, if the open decision in
   section 5 matters to you now.

Strategy, Brand, AI Chat Sales and Design have unchanged bodies. They carry new
stamps only because the old fingerprints were wrong. Reading them is optional;
reading the Brief is not.

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

After, as the paragraph now stands:

> AI Chat is intended for people with a business idea or early-stage project
> whose material is scattered across notes, documents, screenshots and partial
> decisions. They supply what they already have or answer guided questions; the
> service organizes it into a reviewable project model, shows what is missing
> or contradictory, and keeps the accepted result available for later
> questions, criticism and materials. The first setup session is intended to
> take about one focused hour, with unresolved questions left open. The same
> decisions assemble a landing page from SinglePageStartup blocks, edited in a
> private sandbox with an immediate preview and no public address. **Uploaded
> notes and documents are split into chunks, vectorized and stored, so the
> service retrieves the relevant parts as context for its answers. There is no
> ceiling on how many files a person adds: every document is vectorized and can
> take part in answering, and the service selects the most relevant parts each
> time. The operator counts that capacity among the product's selling points,
> because a general assistant holds a project's files in the low tens. How it
> is described to a customer is not selected: Brand keeps vectors, retrieval
> and storage out of the ordinary product flow, so the benefit has to be
> expressed without naming the mechanism.** The desired value is a usable
> project model, answers grounded in the person's own material and a first page
> that can reach real customers; better answer quality than a general chat
> without that context is a goal to test.

The bold text arrived in two corrections after the first draft of this package.
The rewrite had dropped the retrieval capability entirely; the operator
restored it, then sharpened what the selling point actually is.

**What to read carefully.** The paragraph now carries four separate claims, and
they have different standing:

| Claim                                                      | Standing                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Documents are chunked, vectorized and retrieved as context | Operator statement of the intended design, 2026-09-18                     |
| There is no file ceiling                                   | Operator decision, 2026-09-18, asked about explicitly and confirmed       |
| That capacity is a selling point                           | Operator claim; the capacity difference is documented, the benefit is not |
| A general assistant holds files in the low tens            | Research finding `AC-SPS-25`, second-hand figures, see section 5          |

`sources.retrieval` in the Brief metadata records all four with the same
separation, and names what is not settled: how the capability is described to a
customer, and whether a larger corpus produces better answers for this
customer.

The AI Chat Product's implementation sentence follows the same correction: it
covered the project page alone and now covers uploaded documents and permitted
extensions, chunked, vectorized and retrieved.

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

Revenue Streams, Key Resources and Funding are unchanged.

**Cost Structure and the viability rule changed later**, as the consequence of
the no-file-limit decision. Hosted chat now reads that storage and
vectorization scale with what customers upload, because the offer sets no file
limit, and `service-viability` says:

> The unlimited corpus makes part of those costs grow with each customer's
> uploads rather than with their paid use, so the token terms have to price
> ingestion and storage, not only answers. Neither the terms nor a cost per
> document is defined yet.

This is worth reading against the first Sales blocker, "Define the token unit,
price, currency, packages, payment timing, expiry and refund terms." That
blocker now has a constraint attached: a price per answer alone does not cover
a corpus the customer can grow without limit.

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

Three of the six have already lost that stamp: the Brief, the shared model and
the AI Chat Product, because the retrieval and corpus corrections changed their
bodies. Only AI Chat Sales, Strategy and Brand still carry a 2026-09-18
approval, and each of those bodies is unchanged since 2026-09-17.

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

**The competitor figure behind the selling point is second-hand.** Research
finding `AC-SPS-25` records that ChatGPT Projects caps files per project in the
low tens: 5 for Free, 25 for Go and Plus, 40 for Pro, Business, Education and
Enterprise, with OpenAI's own pages disagreeing, the File Uploads FAQ giving 20
where the Projects article gives 25. The official pages returned HTTP 403 to
the coordinator, so the per-plan numbers come from secondary summaries and only
the order of magnitude is treated as supported. If you can open those pages
under your own account, the finding should be re-sourced to them.

**Four business decisions remain open** in AI Chat Sales, unchanged and
correctly recorded as blockers: token unit and price terms, the
payment-accepting party's legal details and the Russian receipt flow, the
selected AI/storage/infrastructure providers, and the GitHub authorization
scope with deployment-credential handling. The first of them now has the
ingestion-cost constraint attached, as section 2 describes.

## 6. Eight documents still awaiting your reading

These keep an invalid stamp on purpose. Their bodies are unchanged and carry no
superseded statement; they were never put in front of you, so they are not
marked confirmed.

- `brief` — the retrieval restore, the corpus capacity and the no-limit decision
- `model.framework-service` — the cost consequence in section 2
- `product.ai-chat.product` — the implementation sentence
- `product.ai-chat.website`
- `product.ai-chat.page.website.landing`
- `product.ai-chat.page.website.project-workspace`
- `product.ai-chat.page.content.one-hour-setup`
- `product.ai-chat.page.content.project-model`

## State of the workspace

- No document resolves as `stale`. Every recorded input snapshot was refreshed
  after its impact review.
- 6 confirmed, 8 with an invalid stamp awaiting reading, 39 never confirmed
  (ordinary drafts). The Brief, the shared model and the AI Chat Product joined
  the waiting list as the retrieval and corpus corrections went into them; a
  body that changes loses its stamp, which is the machine working, not a fault.
- The pipeline reports 22 passed and 2 gaps: one approval gap, the Brief
  awaiting your reading, and the decision gap of the four business decisions.
  Strategy, Brand and Design pass their own checks and wait only on the Brief.
- Two research documents changed with no stamp to lose: the AI Chat research
  summary and its competitors page, which carry `AC-SPS-25` and the sharpened
  differentiation hypothesis.
