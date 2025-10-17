import { ContentfulStatusCode } from "hono/utils/http-status";

export const httpErrorPatterns = new Map<
  ContentfulStatusCode,
  (string | RegExp)[]
>([
  [
    400,
    [
      "Telegram bot is not running",
      "RBAC_SECRET_KEY not set",
      "RBAC_SECRET_KEY is not defined",
      "RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS not set",
      "RBAC secret key not found",
      "Invalid id",
      "Invalid id, id is required",
      "Invalid id. Got:",
      "Invalid orderToProductId",
      "Invalid messageId, messageId is required",
      "Invalid data",
      "Invalid data, data is required",
      "Invalid data, slug and payload are required",
      "Invalid data, should be array [{'id':'<string>','data':<any>},...]",
      "Invalid data, should be array [{'data':<any>},...]",
      "Invalid body",
      "Invalid notification method",
      "No uuid provided",
      "No notification.notification.method provided",
      "No notification.topic.slug provided",
      "No template variant provided",
      "Files are not supported",
      "Missing headers",
      /Provider .* is not allowed/i,
      "Email is required",
    ],
  ],

  [
    401,
    [/invalid credentials/i, /unauthorized/i, /token required/i, /no session/i],
  ],

  [403, ["Forbidden", "Authentication", "Permission"]],

  [
    404,
    [
      "Not found",
      "Form not found",
      "Entity not found",
      "No inputs found",
      "No topic found",
      "No template found",
      "Order not found",
      "Order to product not found",
      "Orders to products not found",
      "No orders to products found",
      "Products not found",
      "Billing currencies not found",
      "Orders to billing module currencies not found",
      "No subjects to identities found",
      "No identities found",
      "No order found",
      "No entity found",
      "No payment intents found",
      "No payment intents to invoices found",
      "No invoices found",
      "No updated order found",
    ],
  ],

  [422, ["Expected string", "Invalid body['data']"]],

  [
    500,
    [
      "Configuration error",
      "Internal Server Error",
      "Internal server error",
      "Request not created",
    ],
  ],
]);
