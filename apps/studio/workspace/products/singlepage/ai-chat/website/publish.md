---
confirmation:
  confirmed: false
review:
  dependencies:
    product.ai-chat.page.website.landing-page-workspace: 26b91ce1c62dbbc3e377d4136d74726b49bacd63aa2ff4c17d9294cda8e25d0e
    product.ai-chat.website: db31acbb2f6bff59d196207b3f6245f4fc7674dbe685f71a18c890fef7e2d2cf
---

# Future server deployment

Server deployment is outside the first release. The current offer is written project and product descriptions, review and correction, export and continued chat.

Deployment will become a paid offer after evaluation and improvement of the project-description workflow. Its price and availability are not set.

## Intended future repository connection

The future flow will request GitHub authorization for the single project repository the service creates in the user's account. It will write the reviewed landing-page project and Code Framework foundation to that repository.

## Intended future server connection

The user will connect a server or a supported provider such as Beget or Timeweb using the required deployment key. A domain the user already owns can be attached through that provider; AI Chat does not sell or register domains.

## Intended future deployment and recovery

GitHub Actions will handle first deployment and later approved updates to the same repository and server. The future view will identify repository creation, server connection, deployment configuration, deployment completion and the public address as separate steps.

If a connection or deployment step fails, preserve the repository and last working deployment, identify the failed step and allow retry without rebuilding the page. These are requirements for the later capability, not available first-release actions.

[Return to my project texts](/projects/example)
