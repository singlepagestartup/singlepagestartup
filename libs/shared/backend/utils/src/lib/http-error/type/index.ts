import { ContentfulStatusCode } from "hono/utils/http-status";

export const categoryStatus = {
  "Authentication error": 401,
  "Payment error": 402,
  "Permission error": 403,
  "Validation error": 400,
  "Configuration error": 500,
  "Not Found error": 404,
  "Conflict error": 409,
  "Rate limit error": 429,
  "Payload Too Large error": 413,
  "Unprocessable Entity error": 422,
  "Internal error": 500,
  Other: 500,
} as const satisfies Record<string, ContentfulStatusCode>;

export type ErrorCategory = keyof typeof categoryStatus;

export type ErrorPatternEntry = {
  status: ContentfulStatusCode;
  category: ErrorCategory;
  patterns: RegExp[];
};

export interface UtilsProp {
  status: ContentfulStatusCode;
  message: string;
  category: ErrorCategory;
  details?: any;
}
