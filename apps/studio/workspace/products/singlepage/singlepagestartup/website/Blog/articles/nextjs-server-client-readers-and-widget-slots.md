---
confirmation: { confirmed: false }
slug: "nextjs-server-client-readers-and-widget-slots"
createdAt: "2026-10-23"
category: "frontend"
title: "Next.js in SPS: readers, client boundaries and Widget slots"
excerpt: "Trace a saved Blog article through the SDK, shared reader and presentation without duplicating requests or moving business logic into Website Builder."
cover: "next-server-client"
coverAlt: "Two people discussing a laptop at a worktable."
author: "SinglePageStartup editorial"
authorRole: "Architecture and implementation notes"
---

A Blog article in SinglePageStartup has several identities: a database record, an SDK result, a selected frontend variant and a place in a saved page composition. Keeping those identities explicit makes a visual change easier to review. The article can acquire a new card layout while its ID, localized content, linked files and business operations remain the same. Start with the owning Blog component and follow its reader before changing the surrounding page.

## Follow the saved record

The Article default variant demonstrates the normal SPS arrangement. Its index.tsx binds the Blog client SDK, server SDK, Provider, loading component and visual component to the shared default component. Component.tsx renders the loaded record. This arrangement gives record loading a clear owner. Adding another fetch inside the visual component would create a second request and a second loading lifecycle for the same entity.

The public discriminator belongs in interface.ts. Its literal value must also appear in the effective variants registry and props union. A folder containing JSX is insufficient if a saved variant cannot select it. The root registry combines the singlepage and startup layers; an override must replace the matching implementation and its public contract together. This matters when a project adds required props to an inherited variant.

## Choose the execution side

Next.js Server Components and Client Components have different execution capabilities. The [Next.js 15 documentation](https://nextjs.org/docs/15/app/getting-started/server-and-client-components) describes serializable props and composition through children. SPS applies that boundary inside its component template: index.tsx chooses execution, readers obtain data, and an interactive ClientComponent owns hooks and browser state. The isServer prop selects SPS reading behavior; a real client JSX boundary still needs an appropriate client entrypoint.

An ordinary saved-record view uses the shared reader. A custom operation can justify local client.tsx and server.tsx readers, with the same typed result supplied to Component.tsx. Those files replace the relevant reading behavior. Wrapping the unchanged shared reader inside another Provider would give ownership to both. Keep the specialized SDK operation visible in the public request and result types so a reviewer can verify what the view actually loads.

## Pass loaded records explicitly

When a parent already has the current SDK result, dataSource="props" lets a child render it without fetching again. The parent retains query subscriptions, loading and error state. A later refetch supplies new props. A constant query function returning an old record would keep that record detached from subsequent reconciliation.

```tsx
<Article variant="overview-default" isServer={props.isServer} dataSource="props" data={props.data} language={props.language}>
  {props.children}
</Article>
```

This is the composition used by the Blog overview wrapper. At a server-to-client boundary, pass only the UI inputs the child declares. A broad props spread can carry SDK bindings, Providers or constructors from the reader. A TypeScript cast does not turn those values into serializable data. Resolve server render callbacks on the server and pass their rendered React nodes to client slots.

## Keep operation and presentation separate

A domain Widget owns principal scope, forms, mutations and operation state. A Website Builder Widget owns editable presentation and slots. The domain Widget reads its exact saved relation to Website Builder, then uses that relation's default renderer to render the linked record and forward children. Choosing a frame by title or the first matching variant would connect a different saved instance after an editor adds another frame.

Relations keep their own identity, ordering and references. They should not choose a business screen or create a checkout form. Module direction also applies to types and frontend imports: Blog can use Website Builder, while an author composition involving Social belongs to a higher consumer. A slot lets the lower presentation accept the resulting content without importing its owner.

## Review the actual page

Use a saved article with a cover, localized body and ordered Widget associations. Confirm that the page contains those exact records after the visual change. Check loading and error states at the reader, then check one loaded model independently of the grid Widget that repeats it. Test both locales and a built Host route: a browser-created session on a cached page can require a client reader even when the public article remains server-rendered. The component contract and the Article overview source show where each responsibility belongs.

## Keep route inputs local

Host's leaf Page composition reads named URL segment values inside its render-reader callback. Pass the selected Article slug directly to the Blog consumer. Threading the entire route map through Widgets and relations makes unrelated components depend on page routing and obscures which resource a reader actually requests.

## Source code

- [.agents/contracts/engineering/frontend-components.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/.agents/contracts/engineering/frontend-components.md)
- [libs/modules/blog/models/article/frontend/component/src/lib/singlepage/default/index.tsx](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/frontend/component/src/lib/singlepage/default/index.tsx)
- [libs/modules/blog/models/article/frontend/component/src/lib/singlepage/overview-default/Component.tsx](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/frontend/component/src/lib/singlepage/overview-default/Component.tsx)
- [libs/modules/blog/relations/articles-to-website-builder-module-widgets/frontend/component/src/lib/singlepage/default/Component.tsx](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/relations/articles-to-website-builder-module-widgets/frontend/component/src/lib/singlepage/default/Component.tsx)
- [.agents/contracts/engineering/module-dependencies.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/.agents/contracts/engineering/module-dependencies.md)
