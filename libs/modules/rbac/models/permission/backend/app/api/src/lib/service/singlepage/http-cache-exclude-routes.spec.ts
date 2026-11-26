import { RouteMatcher } from "@sps/shared-utils";
import { rbacHttpCacheExcludeRoutes } from "./http-cache-exclude-routes";

const matcher = new RouteMatcher(rbacHttpCacheExcludeRoutes);
const subject = "/api/rbac/subjects/3f2504e0-4f89-11d3-9a0c-0305e82c3301";
const commerce = `${subject}/ecommerce-module`;
const crm = `${subject}/crm-module/workspace`;

it.each([
  subject,
  `${subject}/social-module/profiles/profile-id/chats/chat-id/openrouter/model-favorites`,
  `${subject}/blog-module/articles/article-id/content`,
  `${crm}/overview`,
  `${crm}/orders`,
  `${crm}/order`,
  `${crm}/customers`,
  `${crm}/customer`,
  `${crm}/employees`,
  `${crm}/employee`,
  `${crm}/thread`,
  `${crm}/attachment`,
  `${crm}/artifact`,
  "/api/billing/invoices",
  "/api/billing/payment-intents",
  "/api/ecommerce/orders",
  "/api/rbac/subjects-to-ecommerce-module-orders",
  `${commerce}/catalogue-context`,
  `${commerce}/orders-to-products`,
  `${commerce}/orders`,
  `${commerce}/orders/quantity`,
  `${commerce}/orders/total`,
  `${commerce}/orders/order-id/quantity`,
  `${commerce}/orders/order-id/total`,
])("bypasses the HTTP cache for GET %s", (path) => {
  expect(matcher.matches(path, "GET")).toBe(true);
});

it("bypasses the HTTP cache for task result file headers", () => {
  expect(matcher.matches(`${crm}/artifact`, "HEAD")).toBe(true);
});

it.each([
  ["/api/ecommerce/products", "GET"],
  [`${commerce}/other`, "GET"],
  [`${commerce}/orders/order-id/total/extra`, "GET"],
  [`${commerce}/orders`, "POST"],
])("leaves %s (%s) outside the RBAC cache exclusions", (path, method) => {
  expect(matcher.matches(path, method)).toBe(false);
});
