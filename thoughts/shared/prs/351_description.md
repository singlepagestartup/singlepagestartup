Closes #348.

## What changes

A caller could ask how many private records matched a filter even when RBAC denied access to the corresponding list. The framework seed now binds the existing Admin role to 47 GET count permissions. The change uses the ordinary roles-to-permissions relation. It affects internal models and relations in Agent, Analytic, Broadcast, CRM, Ecommerce, Notification, RBAC and Social, plus three historical Telegram permissions.

The RBAC inventory no longer lists these routes among the permissions intentionally left without a role. Its regression test removes the Admin binding from the Social message count and checks that the inventory reports the exact route.

On the current Host, admin-v2 checks the signed-in Subject and Admin role, then renders its overview with the browser SDK. That SDK already sends the user's JWT. The earlier per-card wrappers are redundant on this base. Applications can still choose the reader when composing their own cards.

## Verification against main

- Sent 301 HTTP checks to a local API backed by an isolated PostgreSQL database and Redis. For all 44 mounted routes, guests and ordinary accounts received 403. Administrators received 200 and an integer. An ID filter matching no records returned zero for the admin. Repeating the same URL without admin access after the successful request still returned 403.
- The three historical Telegram count routes have seed permissions but no handlers in the current API. The API returned 403 to guests and ordinary accounts and 404 to the admin.
- Anonymous counts returned 200 for products, articles, forms, currencies and Website Builder widgets. Notification templates and their notification relations retain four public list and detail permissions. Both list routes answered 200 as a guest.
- Verified an update on a populated test database. After removing the Admin binding, a guest could read the Analytic metric count. Rerunning the standard seed restored one binding. The guest then received 403 and the admin received 200.
- In Chromium, signed in as an admin and opened nine module overviews. All 24 protected model cards sent authenticated requests and displayed the number returned by the API.

## Downstream migration

Apply the framework snapshots with `npx nx run api:db:seed` to install the bindings on an existing database. Projects that manage their own RBAC data can attach the intended role to these count permissions in their own configuration.

Check `GET /api/social/messages/count` with a guest, an ordinary account and an admin. Expect 403, 403 and 200 respectively. If a project overrides an admin overview, verify that its protected counts carry the signed-in user's credentials.
