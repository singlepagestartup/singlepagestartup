import { ContentfulStatusCode } from "hono/utils/http-status";
import { httpErrorPatterns } from "./paterns";
import { ErrorPatternEntry, UtilsProp } from "./type";
import { parseCategoryFromMessage } from "./parser";
import { extractMessage, extractOriginalError } from "./extract";

export function util(error: any): UtilsProp {
  const message = extractMessage(error) || "Unknown error";
  const details = extractOriginalError(error);

  const parsedCategory = parseCategoryFromMessage(message);

  if (parsedCategory) {
    let status: ContentfulStatusCode = 500;
    switch (parsedCategory) {
      case "Authentication error":
        status = 401;
        break;
      case "Validation error":
      case "Configuration error":
        status = 400;
        break;
      case "Permission error":
        status = 403;
        break;
      case "Not Found error":
        status = 404;
        break;
      case "Internal error":
        status = 500;
        break;
      default:
        status = 500;
    }
    return { status, message, category: parsedCategory, details };
  }

  for (const entry of httpErrorPatterns as ErrorPatternEntry[]) {
    if (entry.patterns.some((regex) => regex.test(message))) {
      return {
        status: entry.status,
        message,
        category: entry.category,
        details,
      };
    }
  }

  return {
    status: 500,
    message: `Internal server error: ${message}`,
    category: "Internal error",
    details,
  };
}
