---
confirmation:
  confirmed: false
review:
  dependencies:
    product.ai-chat.page.content.project-model: cea20d06949299e0fc1861e91aa73e3a388eb69324da5172a2cf3a8d8bb4747e
    product.ai-chat.website: e1989d4215fe29be295c762314b12748a711d7b459df3bed937424ae84b2fa6f
---

# Build and preview the landing page in a sandbox

AI Chat prepares the first draft from the selected customer, problem, offer, evidence and action in the Project model. The page is assembled from available SinglePageStartup blocks. Edit its data and inspect the frontend result here. This version is a private preview until the user starts the publication flow.

## Start from project decisions

| Landing-page decision        | What AI Chat uses                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Customer**                 | The selected Customer Segment, its situation and decision role.                                                   |
| **Problem and result**       | The relevant customer problem, desired progress and the result the product provides.                              |
| **Offer**                    | The Value Proposition, included result, price or commercial condition when defined, and important limits.         |
| **Reason to choose**         | Approved evidence, relevant difference from alternatives and supported claims.                                    |
| **Primary action**           | The next action defined for this point in the Sales process, including the information the customer must provide. |
| **Objections and questions** | Material objections, conditions, dependencies and answers needed before the customer can act.                     |

If a required decision is unknown or conflicting, the editor shows it beside the affected section. The rest of the page remains available for work.

## Edit the sandbox

The editor provides two views of the same saved landing-page data:

- **Text** contains the headline, explanation, offer, proof, process, answers to objections and primary action;
- **Layout** renders the selected SinglePageStartup blocks with that wording, imagery, form and actions.

A change is saved to the project in the service database and can appear immediately in Layout for frontend testing. The user can revise a block, change its order, select approved imagery and inspect the complete customer path without deploying a site.

When work on the page reveals a real problem with the customer, offer, price, evidence or sales action, update that decision in the Project model. The landing page then uses the revised decision after review.

## Publish the page on your server

The sandbox is the version used to review the page. It is not published until the user selects **Publish on my server**.

The publication flow asks the user to sign in with GitHub and authorize access to the project repository. SinglePageStartup creates the repository in the user's GitHub account and writes the current landing page and Code Framework foundation to it.

The user then connects an existing server or opens an account with a hosting provider such as Beget or Timeweb. The interface asks for the deployment key supplied by the server or provider. SinglePageStartup configures automatic deployment from the GitHub repository to that server. After the first deployment, the landing page receives a public address.

The authorized GitHub connection remains available for later approved changes. SinglePageStartup writes those changes to the same repository, and the configured deployment updates the public site.

[Publish on my server](/projects/example/landing-page/publish)

[Return to the business workspace](/projects/example)
