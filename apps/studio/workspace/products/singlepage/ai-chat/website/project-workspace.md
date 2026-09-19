---
confirmation:
  confirmed: true
  by: operator
  at: 2026-09-17
  source: "Operator confirmed the complete revised Business workspace in chat:
    «Здесь всё окей, можно подтверждать и давать следующую страницу»."
  content_sha256: b6dcff3727fcebc01171b581bd96aa6fb45cb9273193633a6153ca84d36e8321
review:
  dependencies:
    product.ai-chat.page.content.project-model: cea20d06949299e0fc1861e91aa73e3a388eb69324da5172a2cf3a8d8bb4747e
    product.ai-chat.website: e1989d4215fe29be295c762314b12748a711d7b459df3bed937424ae84b2fa6f
---

# Business workspace

After the first review, the project opens on this page. It shows the current Project model, unresolved questions and the actions available for continued work.

## Project model

The main navigation keeps the five sections from the first setup visible:

| Section      | What appears on the page                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Request**  | What the project is, its current situation, products, intended result, boundaries, constraints, supplied material and unanswered client facts. |
| **Strategy** | How the complete project should work: priority audiences, product roles, positioning, customer paths, channels and measures of success.        |
| **Brand**    | What people should understand and remember: the promise, supported claims, evidence, voice, objections and calls to action.                    |
| **Design**   | Visual identity, interface principles, existing assets, imagery and constraints that affect the customer-facing result.                        |
| **Products** | Customer and value, access and relationship, money and delivery, sales and learning for every product in scope.                                |

Selecting a section shows its current statements and their review state. The user can edit that section, open a more detailed document when the topic needs one or add another product. Changes appear on the Project model after they are reviewed.

Each statement is marked as **accepted**, **proposal**, **unknown** or **conflict**. Unknown information remains visible and affects only the actions that require it. A conflict shows the supplied statements that disagree instead of choosing one silently.

## Work with AI Chat

The chat stays beside the Project model. Ask a question in ordinary language, request criticism, compare alternatives or ask for a change. AI Chat uses the reviewed project decisions and names missing information when it would change the answer.

| Action                         | What happens                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ask about the project**      | Receive an answer based on the accepted decisions and visible unknowns.                                                                            |
| **Challenge an idea**          | See its assumptions, contradictions, alternatives and the reasons behind the recommendation.                                                       |
| **Change a decision**          | Review a proposed revision in the relevant section before it replaces the accepted wording.                                                        |
| **Improve supplied material**  | Revise an uploaded document or prepare new material using the current Project model. Accepted project decisions remain unchanged unless requested. |
| **Show important unknowns**    | See the unanswered questions that affect the selected action, without blocking unrelated work.                                                     |
| **Create the landing page**    | Open a page workspace using the selected audience, problem, offer, evidence and action.                                                            |
| **Add another product**        | Define its customer, value and conditions while reusing a shared model only where it actually applies.                                             |
| **Publish the landing page**   | Open the approved page, connect GitHub and deploy it to the user's server.                                                                         |
| **Continue to Code Framework** | See which existing functions apply to a chatbot or other digital product and continue toward deployment on the user's server.                      |

## Continue working

The page keeps the current token balance, save state and number of unresolved questions visible. If an action requires more tokens than remain, the work is saved before the user moves to token purchase and resumes at the same point afterward.

The complete Project model can be downloaded as Markdown or HTML for use outside AI Chat. Exporting does not create another editable copy inside the workspace.

[Create the landing page](/projects/example/landing-page) · [Buy tokens](/tokens) · [Open Code Framework](https://github.com/singlepagestartup/singlepagestartup)
