import { ErrorPatternEntry } from "../type";

export const httpErrorPatterns: ErrorPatternEntry[] = [
  // Authentication (Specific)
  {
    status: 401,
    category: "Authentication error",
    patterns: [
      /invalid credentials/i,
      /unauthorized/i,
      /token required/i,
      /no session/i,
      /authorization error/i,
      /no subject provided in the token/i,
      /invalid token issued/i,
    ],
  },
  // Permissions (Specific)
  {
    status: 403,
    category: "Permission error",
    patterns: [
      /forbidden/i,
      /permission/i,
      /authentication/i,
      /only order owner can update order/i,
      /only identity owner can create identity/i,
    ],
  },
  // Unprocessable Entity (Specific Semantic Validation)
  {
    status: 422,
    category: "Unprocessable Entity error",
    patterns: [
      /expected string/i,
      /invalid body\['data'\]/i,
      /unprocessable entity/i,
      /invalid type[.]? expected email, got:/i,
    ],
  },
  // Payment Errors (Can include 'not found')
  {
    status: 400,
    category: "Payment error",
    patterns: [
      /payment intent not found/i,
      /cloudpayments (credentials|invoice id) not found/i,
      /stripe secret key not found/i,
      /payment intent is not succeeded/i,
      /orders to billing module payment intents not found/i,
      /billing module currencies not found/i,
      /multiple billing module payment/i,
      /channel not found/i,
      /currency is required/i,
      /currency not found/i,
    ],
  },
  // Internal/Server Errors (Can include 'not found')
  {
    status: 500,
    category: "Internal error",
    patterns: [
      /configuration error[.]?/i,
      /environment error[.,]? rbac_secret_key not found/i,
      /rbac_jwt_secret not set/i,
      /rbac_secret_key not set/i,
      /rbac_secret_key is not defined/i,
      /rbac_anonymous_jwt_refresh_token_lifetime_in_seconds not set/i,
      /rbac secret key not found/i,
      /internal server error/i,
      /request not created/i,
      /jwt secret not provided/i,
      /server error/i,
    ],
  },
  // General Not Found (Broad pattern, checked after specific ones)
  {
    status: 404,
    category: "Not Found error",
    patterns: [
      /not found/i,
      /entity not found/i,
      /form not found/i,
      /entity with param .* not found/i,
      /no (inputs|email|stores|template|attributes?|products?|orders?|subjects to identities|attribute keys to attributes|orders to products|ecommerce orders to billing module currencies|billing module currency id) found/i,
      /order already exists/i,
      /order is not in 'new' status/i,
    ],
  },
  // General Validation (Broad, checked last for 400)
  {
    status: 400,
    category: "Validation error",
    patterns: [
      /invalid request body/i,
      /validation error/i,
      /invalid url/i,
      /invalid (data|body)/i,
      /invalid data, (slug and payload|data) are required([.]|.)?/i,
      /invalid data, should be array/i,
      /invalid notification method/i,
      /missing headers/i,
      /invalid provider/i,
      /invalid ordertoproductid/i,
      /invalid messageid([.,]|, messageid is required)?/i,
      /invalid id([.,]|, id is required)?/i,
      /no refresh token provided/i,
      /passwords do not match/i,
      /account already exists/i,
      /code is expired/i,
      /provider .* is not allowed/i,
      /no (uuid|productid|notification\.topic\.slug) provided/i,
      /files are not supported/i,
      /multiple files are not allowed/i,
      /no id provided/i,
    ],
  },
];
