---
confirmation:
  confirmed: false
review:
  dependencies:
    model.framework-service: 24505045708eaee8184c7d988841e54b6408be46051b785d18989c6329a14a80
    product.ai-chat.page.website.landing-page-workspace: bdf5dc2463fa374414e8a6aa09d54f8277b9d8bd7fec5592c5c5b1c8406a7629
    product.ai-chat.website: e1989d4215fe29be295c762314b12748a711d7b459df3bed937424ae84b2fa6f
---

# Publish the landing page

The sandbox is the private version used to review the page. Publication creates a project repository in the user's GitHub account, connects that repository to the user's server and deploys the page there.

## Connect the repository

Select **Sign in with GitHub** and authorize access to the project repository. SinglePageStartup creates the repository in the user's account and writes the deployable landing-page project to it.

## Connect the server

Connect an existing server or open an account with a hosting provider such as Beget or Timeweb. The interface explains how to obtain the required deployment key and where to enter it.

## Deploy the page

SinglePageStartup prepares the project from the approved landing-page content and Code Framework foundation, writes it to the repository and configures automatic deployment to the connected server.

The deployment view shows each material step:

1. GitHub connected;
2. repository created;
3. server connected;
4. deployment configured;
5. first deployment completed;
6. public address ready.

If a step fails, keep the repository and the last working deployment unchanged, name the failed step and allow the user to retry it.

## Apply later changes

The authorized GitHub connection remains available for later approved changes. SinglePageStartup writes those changes to the same repository, and the configured deployment updates the site on the user's server.

[Sign in with GitHub](/integrations/github)

[Connect the server](/projects/example/landing-page/publish/server)

[Return to the landing-page sandbox](/projects/example/landing-page)
