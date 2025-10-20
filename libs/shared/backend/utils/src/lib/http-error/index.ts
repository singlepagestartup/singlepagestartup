import { ContentfulStatusCode } from "hono/utils/http-status";
import { httpErrorPatterns } from "./paterns";

// Вспомогательные функции:
function extractMessage(error: any): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.cause) return extractMessage(error.cause);
  return String(error);
}
function extractOriginalError(error: any): any {
  if (error?.cause) return extractOriginalError(error.cause);
  return error;
}

export function util(error: any): {
  status: ContentfulStatusCode;
  message: string;
  details?: any;
} {
  const message = extractMessage(error) || "Unknown error";
  const details = extractOriginalError(error);

  for (const [status, patterns] of httpErrorPatterns) {
    if (patterns.some((regex) => regex.test(message))) {
      return { status, message, details };
    }
  }
  return {
    status: 500,
    message: `Internal server error: ${message}`,
    details,
  };
}
