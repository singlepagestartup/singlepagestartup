import { ContentfulStatusCode } from "hono/utils/http-status";

export type ErrorCategory =
  | "Authentication error"
  | "Validation error"
  | "Permission error"
  | "Configuration error"
  | "Not Found error"
  | "Payment error"
  | "Internal error"
  | "Other";

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
