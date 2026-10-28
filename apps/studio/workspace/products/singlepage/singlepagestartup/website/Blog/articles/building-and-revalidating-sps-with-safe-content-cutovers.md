---
confirmation: { confirmed: false }
slug: "building-and-revalidating-sps-with-safe-content-cutovers"
createdAt: "2026-10-23"
category: "devops"
title: "Shipping an SPS visual change: builds, caches and content cutovers"
excerpt: "Verify the built Host, keep authorization ahead of caches and make saved Widget relinks repeatable and reviewable."
cover: "safe-build-rollout"
coverAlt: "People reviewing a release together at a worktable."
author: "SinglePageStartup editorial"
authorRole: "Architecture and implementation notes"
---

Moving a design from Storybook into the SPS Framework changes both code and saved composition. A production variant can be registered correctly while a Host Widget still points to its older frame. A page can display the new frame while its cart action sends an incomplete payload. Release evidence therefore needs the built Host, the exact linked records and the operation results. A screenshot answers only one of those questions.

## Build the process that will run

The root scripts expose host:build and host:start. Start uses the same Host wrapper that sets the expected Node environment. Check the built application with the local API and its actual saved records. Dev rendering can hide a request boundary problem: reading a session cookie inside an ISR fallback can fail in the built route even if interactive navigation appeared to work during development.

```sh
npm run host:build
npm run host:start
```

Keep public content and current-Subject operations at their intended boundaries. A public catalog can remain server-rendered while the owning RBAC Widget mounts its current-user operation on the client. Passing isServer false into an arbitrary server subtree does not by itself establish a valid client boundary. Review the component entrypoint and the props that cross it, especially reader bindings and rendered slots.

## Distinguish the caches

Nx task caching concerns build and test outputs configured through targets and inputs. API response caching concerns HTTP reads. React Query owns mounted client results, and the Host also has Next data and page caches. Clearing one does not prove the others are fresh. When a changed article still appears old, identify the layer serving that response before deleting unrelated state.

The API host registers query parsing and the protected-content guard before its response cache. Protected families are excluded from both the legacy and consistency cache paths. The managed-byte guard appears before raw static handling. Preserve this ordering when changing application composition: a previously warmed response cannot be allowed to bypass a fresh resource decision.

```ts
app.use(parseQueryMiddleware.init());
app.use(protectedBlogContent.init());
// The response cache is registered after these guards.
app.route("/api/blog", blogApp.hono);
```

The excerpt shows relative ordering; apps/api/app.ts contains the conditional cache registration and other middleware. Treat it as a composition rule, not a complete replacement application.

## Publish changes after the write boundary

The shared mutation-effects publisher invalidates API topics before it broadcasts the legacy revalidation event. Its caller must use it after commit. Otherwise another browser can receive an event, immediately refetch and read a stale cached response or uncommitted state. Consistency handling tracks actual read dependencies and retains pending delivery when downstream revalidation fails, according to the transport contract.

The Host revalidation route handles paths or tags and accepts a bounded batch of tags in its POST handler. [Next.js 15 revalidateTag](https://nextjs.org/docs/15/app/api-reference/functions/revalidateTag) invalidates cached data associated with a tag. Use the repository's route and transport contracts rather than adding a second revalidation endpoint for one Widget. Record a failed revalidation separately from whether the owning database write committed.

## Change saved links by exact identity

The Framework cutover tool separates prepare, apply, verify and rollback. Its input names exact saved Host, CRM, Article and presentation associations. Contact presentation is isolated from a shared hero frame before the consumer is relinked. Existing source records remain available where the manifest requires them, and the tool reads back the resulting links. Repeating an applied manifest should skip already satisfied operations.

Preparation is also where unsupported private graph sharing fails closed. An operator must isolate the graph before marking it private. A visual rollback retains security classification and accepted period state where the manifest declares that behavior. Reverting a frame does not authorize making subscriber content public. Keep the manifest's ownership assumptions and any exclusive CMS editing window explicit during apply and rollback.

## Verify behavior and recovery

Use realistic runtime data: multiple attributes, two currencies, a saved cart quantity and a product checkout that returns the actual Invoice payment URL. The commerce integration changes saved prices before checkout and checks the persisted associations, which detects a visual control backed by a static example value. The protected-content integration checks another user's denial after an entitled caller reads the same resources.

Finish with responsive page checks, console and network errors, exact saved-link verification and the repeat operation. For rollback, verify the consumer's restored associations as carefully as the forward change. Report the build command, tested routes, real provider or test transport, and any deliberately bounded coverage. A reviewable rollout connects each visible control to a persisted result and each recovery step to the records it owns.

## Source code

- [package.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/package.json)
- [nx.json](https://github.com/singlepagestartup/singlepagestartup/blob/main/nx.json)
- [tools/runtime/host.mjs](https://github.com/singlepagestartup/singlepagestartup/blob/main/tools/runtime/host.mjs)
- [apps/api/app.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/api/app.ts)
- [libs/shared/backend/api/src/lib/mutation-effects/index.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/backend/api/src/lib/mutation-effects/index.ts)
- [libs/middlewares/src/lib/revalidation/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/middlewares/src/lib/revalidation/README.md)
- [apps/host/app/api/revalidate/route.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/host/app/api/revalidate/route.ts)
- [tools/runtime/framework-widget-links.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/tools/runtime) (directory; file is currently in the local branch)
- [tools/runtime/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/tools/runtime/README.md)
- [apps/api/specs/integration/commerce-checkout.integration.spec.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/apps/api/specs/integration) (directory; file is currently in the local branch)
