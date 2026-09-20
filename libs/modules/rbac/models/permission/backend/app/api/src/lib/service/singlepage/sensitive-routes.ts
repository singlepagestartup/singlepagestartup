import { IRouteRule } from "@sps/shared-utils";

/**
 * Routes that are never public because a permission row happens to carry no
 * role (issue #270).
 *
 * The authorization rule reads an empty `roles-to-permissions` set as "public",
 * and 320 of the 473 seeded permission rows are role-less — the blog, the
 * catalogue, the CRM form and the payment webhooks among them. Inverting the
 * default would close all of them in one commit, so this list SUBTRACTS the
 * few route families that must not fall open by omission. Every other
 * role-less row keeps the behaviour it has today.
 *
 * The expressions are anchored on purpose: a path that merely contains
 * `identities` as part of another segment must not match, and each rule
 * declares its method so the same path under another verb is decided on its
 * own. The subject rule stops at the collection and the id form, because the
 * subject-scoped cart, CRM-form and chat routes below it are legitimately
 * anonymous.
 */
export const sensitiveRoutes: IRouteRule[] = [
  {
    regexPath: /^\/api\/rbac\/identities(\/.*)?$/i,
    methods: ["GET"],
  },
  {
    regexPath: /^\/api\/rbac\/subjects(\/[0-9a-f-]+)?$/i,
    methods: ["GET"],
  },
  {
    regexPath: /^\/api\/rbac\/subjects-to-identities(\/.*)?$/i,
    methods: ["GET"],
  },
  {
    regexPath: /^\/api\/rbac\/roles(\/.*)?$/i,
    methods: ["GET"],
  },
];
