---
confirmation:
  confirmed: true
  by: operator
  at: 2026-09-17
  source: "Operator confirmed the complete current AI Chat Website Overview in
    chat: «Так, страницу подтверждаем. Теперь давай переходим дальше к
    посадочной»."
  content_sha256: c9caa468b93440f6b5c8f0a8315937c8e9a0fd6d5bb2a970d7e487295641606a
review:
  dependencies:
    brand: 8dbe5a27b000710a03ca504b7a56040516cfdb9b54be0a95d910ee4506361590
    design: f57dd47f9b398831ef332ab56613a48858c455a4c143ba9a74377389e51c5629
    model.framework-service: c8a792962f8250e6fc649ac02a907dcbdccdeeb711603c670f06eebd101f9f8e
    product.ai-chat.product: 91f9368e4f450d3a1b82a775df616972fe8aab756c6890331292f5327fdc4d84
    product.ai-chat.sales: 9ce83a549912024d0916ae119c2f6ddb55502ed0d727983f60dfc89e63b60400
    strategy: d68e88a81632b3ddf4f57431d6963c9d74c28bf2ba0a3d9578fb2d925fe3bf82
---

# AI Chat website

## Objective and customer result

AI Chat is for a person who already has a business idea and a mixture of notes, documents, screenshots, images and partial decisions but cannot yet see one usable system. The person uploads that material and reviews a compact Request, Strategy, Brand, Design and Products flow. The result is an editable project model: what the business offers, whom it serves, how it operates and sells, which decisions are missing and what can be done next.

The first setup is structured to create useful project context in about one focused hour. The user may leave an answer unknown, pause the work or open the detailed documents later.

AI Chat assembles the model through the SinglePageStartup method, developed through long-term work combining and adapting business, marketing and product-development methods. Its document structure and decision links are designed for AI agents, so they can place information in the right section, identify gaps and contradictions, update the owning source and use accepted decisions in later work.

The workspace supports three immediate business results:

- use the structured document in later conversations with AI Chat or export it for work elsewhere;
- assemble a landing page from SinglePageStartup blocks, save its data with the project and inspect the frontend preview;
- publish that page through a GitHub repository and the user's server, or use Code Framework for another server-hosted product.

The site should make this outcome understandable within the first screen. It should not lead with the product name, “project context” or a generic invitation to start another project.

## Customer journey and site structure

| Route                                         | Customer situation and page responsibility                                                                                                                                                  | Primary next action                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `/`                                           | The visitor has scattered project material and needs to understand the concrete result: an editable business model, marketing decisions and first landing page.                             | **Organize my materials** → `/register`                  |
| `/register`                                   | A new user creates an account with email and password and sees the free token balance available for the first work.                                                                         | Continue to `/projects/new`                              |
| `/login`                                      | A returning user signs in and returns to the last active project or interrupted task.                                                                                                       | Continue working                                         |
| `/projects/new`                               | The user uploads text, documents and images, then reviews five compact stages. Each screen shows extracted statements, one material question and the live project page.                     | Build my project model → `/projects/[project-id]`        |
| `/projects/[project-id]`                      | The workspace shows the current business model, marketing decisions, missing information, editable source sections, export and a chat that uses the same project.                           | Refine the model, export it or create the landing page   |
| `/projects/[project-id]/landing-page`         | The user assembles the selected audience, offer and action into SinglePageStartup blocks, edits Text and Layout, saves the data with the project and inspects the private frontend preview. | Save the sandbox, publish on the user's server or return |
| `/projects/[project-id]/landing-page/publish` | The user authenticates with GitHub, creates the project repository, connects an existing server or a hosting provider such as Beget or Timeweb and reviews the deployment result.           | Publish the site or return to the sandbox                |
| `/tokens`                                     | The free or purchased balance is insufficient during upload, structuring, document work or chat. The page shows the current balance and configured packages before payment.                 | Buy tokens and return to the interrupted task            |
| `/settings`                                   | An authenticated user manages the account, project details, purchase history, saved sandbox data and account deletion.                                                                      | Save the selected setting or return to work              |
| `/help`                                       | The user needs help with access, payment, materials, the business workspace, landing-page sandbox, GitHub connection or server deployment.                                                  | Send a support request and return to the relevant page   |

Code Framework stays visible throughout the workspace. It supplies the deployable page and application foundation. When a concrete software need appears, the interface shows which existing framework capabilities apply and leads to repository creation and deployment on the user's server.

## Key product interactions

### Upload and guided intake

The upload page accepts mixed project material without asking the user to classify every item. The user can add files and images, paste text and explain what the material is about. AI Chat proposes statements for Request, Strategy, Brand, Design and Products, keeps each source visible and asks one question only when the answer changes the model.

The Products stage keeps the complete Business Model Canvas coverage in four connected groups: customer and value, access and relationship, money and delivery, and sales and learning. The interface does not present nine separate forms.

### Business workspace and chat

The main workspace shows the current business model, marketing decisions and missing information together. A user can open the owning section, correct it directly or ask the chat to challenge an idea, compare alternatives, rewrite a section or prepare a material. The updated document remains exportable for use with another tool or adviser.

### Token purchase

Token balance remains visible while work is being performed. If the next operation requires more tokens, the current task is saved and the user moves to `/tokens`. After a successful purchase the user returns to the same upload, document or chat action rather than starting again.

### Landing-page sandbox and publication

The landing-page workspace uses the selected customer, problem, offer, proof and action from the business model. Available SinglePageStartup blocks assemble an editable Text and Layout sandbox. Each edit is saved to the project in the service database and appears immediately in the frontend preview. The preview has no public address until the user completes publication.

When the user selects **Publish on my server**, the interface requests GitHub authentication and the repository authorization needed to create and update this project. SinglePageStartup creates a repository in the user's account. The user then connects an existing server or opens an account with a hosting provider such as Beget or Timeweb and supplies its deployment key. The system configures automatic deployment from the repository to the server and shows the resulting public address or the exact failed step. Later changes to an owning project decision return the affected sandbox section for review; approved changes can update the same repository and public site.

### Code Framework handoff

When the user needs a site, chatbot or another digital product, the workspace actively presents Code Framework as the underlying route. The recommendation names the applicable ready functions, identifies what still needs adaptation and leads to a repository and deployment on the user's server.

## Page copy and metadata

Title: **Turn your notes and drafts into a business model and prepare your first landing page**

Description: **Upload notes, drafts, documents and images. Review a compact five-stage project model, assemble a landing-page preview and publish it through your GitHub repository and server when ready.**

The main action is **Organize my materials**. Returning users see **Sign in**. Inside the workspace the principal actions are **Ask about this business**, **Update this section**, **Export the document**, **Open the landing-page sandbox**, **Buy tokens** and **Publish on my server**.
