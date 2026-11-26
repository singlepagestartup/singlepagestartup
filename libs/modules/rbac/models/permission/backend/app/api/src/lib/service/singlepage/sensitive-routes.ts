import { type IRouteRule, UUID_PATH_SUFFIX_REGEX } from "@sps/shared-utils";

/** Routes whose controllers authenticate the caller and enforce resource access. */
export const controllerGuardedRoutes: IRouteRule[] = [
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[0-9a-f-]+\/file-storage-module\/files\/[0-9a-f-]+\/content\/?$/i,
    methods: ["GET", "HEAD"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[0-9a-f-]+\/social-module\/chats\/[0-9a-f-]+\/threads\/[0-9a-f-]+\/read\/?$/i,
    methods: ["POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[0-9a-f-]+\/social-module\/profiles\/[0-9a-f-]+\/chats\/[0-9a-f-]+\/threads\/[0-9a-f-]+\/typing\/?$/i,
    methods: ["POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/social-module\/profiles\/[^/]+\/chats\/[^/]+\/openrouter\/model-favorites\/?$/i,
    methods: ["GET", "PATCH"],
  },
  {
    regexPath: /^\/api\/agent\/work-attempts\/[^/]+\/knowledge-index\/?$/,
    methods: ["POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[0-9a-f-]+\/stores\/[0-9a-f-]+\/customer-work\/?$/i,
    methods: ["GET", "POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[0-9a-f-]+\/customer-work\/threads\/[0-9a-f-]+\/?$/i,
    methods: ["GET"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[0-9a-f-]+\/customer-work\/threads\/[0-9a-f-]+\/messages\/[0-9a-f-]+\/attachments\/[0-9a-f-]+\/?$/i,
    methods: ["GET", "HEAD"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/orders\/[^/]+\/work\/?$/,
    methods: ["GET", "POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/orders\/[^/]+\/work\/artifacts\/[^/]+\/?$/,
    methods: ["GET", "HEAD"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/orders\/[^/]+\/work\/artifacts\/[^/]+\/knowledge\/?$/,
    methods: ["POST", "DELETE"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/orders\/[^/]+\/work\/fulfillment\/?$/,
    methods: ["POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/crm-module\/workspace\/(stores|overview|options|orders|order|customers|customer|employees|employee|funnels|funnel|tasks|detail|intake|thread)\/?$/,
    methods: ["GET"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/crm-module\/workspace\/(command|thread)\/?$/,
    methods: ["POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/crm-module\/workspace\/(attachment|artifact)\/?$/,
    methods: ["GET", "HEAD"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/stores\/[^/]+\/provider-connections\/?$/,
    methods: ["GET", "POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/stores\/[^/]+\/products(?:\/[^/]+)?\/?$/,
    methods: ["GET"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/stores\/[^/]+\/products\/[^/]+\/?$/,
    methods: ["PATCH"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/stores\/[^/]+\/products\/[^/]+\/images\/?$/,
    methods: ["POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/stores\/[^/]+\/directories\/(categories|attribute-keys|attributes)\/?$/,
    methods: ["GET", "POST"],
  },
  {
    regexPath:
      /^\/api\/rbac\/subjects\/[^/]+\/ecommerce-module\/stores\/[^/]+\/directories\/(categories|attribute-keys|attributes)\/[0-9a-f-]+\/?$/i,
    methods: ["GET", "PATCH"],
  },
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

/** Catalogue and ownership writes require a granted role, including on role-less permission records. */
const catalogueWriteRoutes: IRouteRule[] = [
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
  {
    // Chat edits from a Subject use the owner-checked Social operations.
    regexPath:
      /^\/api\/(?:social\/(?:chats|threads|chats-to-threads|profiles-to-chats|chats-to-file-storage-module-files)|rbac\/subjects-to-social-module-chats)(?:\/(?:bulk|find-or-create|[0-9a-f-]{36}))?\/?$/i,
    methods: ["POST", "PATCH", "PUT", "DELETE"],
  },
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
export const crmAdminListRoute: IRouteRule = {
  regexPath: /^\/api\/crm\/[^/]+\/admin-records\/?$/i,
  methods: ["GET", "HEAD"],
};

export const sensitiveRoutes: IRouteRule[] = [
  crmAdminListRoute,
  ...privateCommerceRoutes,
  {
    regexPath:
      /^\/api\/(?:social\/chats-to-file-storage-module-files|rbac\/subjects-to-social-module-chats)(?:\/.*)?$/i,
  },
  {
    regexPath: /^\/api\/social\/chats(?:\/.*)?$/i,
  },
  {
    regexPath:
      /^\/api\/social\/(?:messages|threads|(?:chats|threads|profiles)-to-messages|profiles-to-chats|chats-to-threads|chats-to-crm-module-tasks|threads-to-ecommerce-module-products|profiles-to-knowledge-module-sources|profiles-to-ecommerce-module-products)(?:\/.*)?$/i,
  },
  {
    regexPath:
      /^\/api\/knowledge\/(?:sources|chunks|sources-to-chunks|sources-to-file-storage-module-files)(?:\/.*)?$/i,
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
    regexPath:
      /^\/api\/rbac\/(?:subjects-to-identities|subjects-to-crm-module-tasks)(\/.*)?$/i,
    methods: ["GET"],
  },
  {
    regexPath: /^\/api\/rbac\/roles(\/.*)?$/i,
    methods: ["GET"],
  },
  ...catalogueWriteRoutes,
];
