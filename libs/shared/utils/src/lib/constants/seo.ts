/** Paths for application screens, authentication and infrastructure. */
export const SEO_NON_INDEXABLE_PATHS = [
  /^\/(?:admin|api|_next|\.well-known|rbac|account|checkout|cart|ai-chat)(?:\/|$)/i,
  /^\/(?:404|500|sign-in|sign-up|login|logout|register|forgot-password|reset-password)(?:\/|$)/i,
  /^\/ecommerce\/(?:orders?|cart|checkout)(?:\/|$)/i,
  /^\/social\/(?:chats|threads)(?:\/|$)/i,
];

/** Only public content collections may be expanded for the anonymous sitemap. */
export const SEO_PUBLIC_ROUTE_COLLECTIONS = [
  "social.profiles",
  "blog.articles",
  "blog.categories",
  "ecommerce.products",
  "ecommerce.categories",
  "ecommerce.stores",
];

/** Tracking fields do not select the content of a page. */
export const SEO_TRACKING_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "yclid",
  "gclid",
  "dclid",
  "fbclid",
  "msclkid",
  "_openstat",
  "campaign_id",
  "group_id",
  "ad_id",
  "phrase_id",
  "source_type",
  "device",
  "region_id",
  "region_name",
  "etext",
  "ybaip",
];

export const SEO_SITEMAP_MAX_URLS = 50_000;
export const SEO_SITEMAP_MAX_BYTES = 50 * 1024 * 1024;

/** Bound one enumeration independently from each XML file's protocol limit. */
export const SEO_SITEMAP_MAX_CANDIDATES = 1_000_000;
/** When both endpoints are in a route, the visible association is required. */
export const SEO_ROUTE_RELATIONS = [
  {
    name: "blog.categories-to-articles",
    left: "blog.categories",
    right: "blog.articles",
    leftKey: "categoryId",
    rightKey: "articleId",
  },
  {
    name: "ecommerce.categories-to-products",
    left: "ecommerce.categories",
    right: "ecommerce.products",
    leftKey: "categoryId",
    rightKey: "productId",
  },
  {
    name: "social.profiles-to-blog-module-articles",
    left: "social.profiles",
    right: "blog.articles",
    leftKey: "profileId",
    rightKey: "blogModuleArticleId",
  },
  {
    name: "social.profiles-to-ecommerce-module-products",
    left: "social.profiles",
    right: "ecommerce.products",
    leftKey: "profileId",
    rightKey: "ecommerceModuleProductId",
  },
] as const;
