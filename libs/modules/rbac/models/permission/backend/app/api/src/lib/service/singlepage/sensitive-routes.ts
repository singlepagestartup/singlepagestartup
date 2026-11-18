import { type IRouteRule, UUID_PATH_SUFFIX_REGEX } from "@sps/shared-utils";

/** Routes whose controllers authenticate the caller and enforce resource access. */
export const controllerGuardedRoutes: IRouteRule[] = [
  {
    regexPath: /^\/api\/rbac\/subjects\/host-cache\/revalidate\/?$/,
    methods: ["POST"],
  },
  {
    regexPath: /^\/api\/rbac\/subjects\/[^/]+\/blog-module\/articles\/?$/,
    methods: ["POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/blog-module\/articles\/[^/]+\/content$/,
    methods: ["GET"],
  },
  {
    regexPath: new RegExp(
      `^/api/rbac/subjects${UUID_PATH_SUFFIX_REGEX.source}`,
    ),
    methods: ["GET"],
  },
];

/** Raw financial records require a role. Provider callbacks authenticate their notifications. */
export const privateCommerceRoutes: IRouteRule[] = [
  {
    regexPath:
      /^\/api\/billing\/(?:invoices|payment-intents-to-(?:invoices|currencies))(?:\/.*)?$/i,
  },
  { regexPath: /^\/api\/billing\/payment-intents(?:\/.*)?$/i },
  {
    regexPath:
      /^\/api\/ecommerce\/(?:orders|orders-to-products|orders-to-billing-module-(?:currencies|payment-intents)|orders-to-file-storage-module-files|stores-to-orders)(?:\/.*)?$/i,
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects-to-(?:ecommerce-module-orders|billing-module-payment-intents)(?:\/.*)?$/i,
  },
];

/** Catalogue writes use Subject operations for every end user; raw writes require the operator credential. */
export const operatorOnlyCatalogueWriteRoutes: IRouteRule[] = [
  {
    regexPath:
      /^\/api\/ecommerce\/(stores|products|attributes|attribute-keys|stores-to-products|stores-to-attributes|products-to-attributes|stores-to-products-to-attributes|attribute-keys-to-attributes|attributes-to-billing-module-currencies|offers-to-offers)(?:\/[^/]+)?\/?$/i,
    methods: ["POST", "PATCH", "PUT", "DELETE"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects-to-ecommerce-module-(stores|products|orders)(?:\/.*)?$/i,
    methods: ["POST", "PATCH", "PUT", "DELETE"],
  },
];

/** End-user permissions cannot grant these infrastructure operations. */
export const operatorOnlyRoutes: IRouteRule[] = [
  ...operatorOnlyCatalogueWriteRoutes,
  {
    regexPath:
      /^\/api\/rbac\/subjects\/ecommerce-module\/orders\/payment-intents\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(?:check|providers\/[^/]+)\/?$/i,
    methods: ["POST"],
  },
];

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
 * own. The subject rule covers the collection, its count and the id form, and
 * separately the identities below a subject, because that route answers with
 * identity rows. The other subject-scoped routes — cart, CRM form and chat —
 * are legitimately anonymous and stay open.
 */
export const sensitiveRoutes: IRouteRule[] = [
  ...privateCommerceRoutes,
  {
    regexPath: /^\/api\/social\/chats(?:\/.*)?$/i,
    methods: ["GET", "HEAD"],
  },
  {
    regexPath:
      /^\/api\/social\/profiles-to-file-storage-module-files(?:\/.*)?$/i,
    methods: ["GET", "HEAD"],
  },
  {
    regexPath: /^\/api\/rbac\/identities(\/.*)?$/i,
    methods: ["GET"],
  },
  {
    regexPath: /^\/api\/rbac\/subjects(\/count|\/[0-9a-f-]+)?$/i,
    methods: ["GET"],
  },
  {
    regexPath: /^\/api\/rbac\/subjects\/[0-9a-f-]+\/identities(\/.*)?$/i,
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
  ...operatorOnlyCatalogueWriteRoutes,
];
