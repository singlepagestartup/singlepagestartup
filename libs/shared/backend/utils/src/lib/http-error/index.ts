import { ContentfulStatusCode } from "hono/utils/http-status";
import { httpErrorPatterns } from "./paterns";
import { ErrorPatternEntry, UtilsProp } from "./type";
import { parseCategoryFromMessage } from "./parser";
import { extractMessage, extractOriginalError } from "./extract";
import { util as sanitizeMessage } from "./sanitize";
import { util as formatZodIssues } from "./zod-issues";
import { util as isUniqueConstraintError } from "../unique-constraint-error";

export function util(error: any): UtilsProp {
  const message = sanitizeMessage(extractMessage(error) || "Unknown error");
  const details = extractOriginalError(error);

  // A unique violation is recognized by the driver code rather than by its
  // text, and answered with a fixed message: the driver's own message names the
  // constraint, and the details it carries stay server-side.
  if (isUniqueConstraintError(error)) {
    return {
      status: 409,
      message: "Conflict error. Entity already exists",
      category: "Conflict error",
      details,
    };
  }

  try {
    const parsed = JSON.parse(message);
    if (typeof parsed?.status === "number") {
      const parsedMessage = parsed?.message || message;
      const parsedCategory = parseCategoryFromMessage(parsedMessage);
      const parsedDetails = parsed?.cause ?? details;

      if (parsedCategory) {
        return {
          status: parsed.status,
          message: parsedMessage,
          category: parsedCategory,
          details: parsedDetails,
        };
      }

      for (const entry of httpErrorPatterns as ErrorPatternEntry[]) {
        if (entry.patterns.some((regex) => regex.test(parsedMessage))) {
          return {
            status: parsed.status,
            message: parsedMessage,
            category: entry.category,
            details: parsedDetails,
          };
        }
      }

      return {
        status: parsed.status,
        message: parsedMessage,
        category: "Internal error",
        details: parsedDetails,
      };
    }

    // The shared repository serializes a failed schema parse as `{ zodError }`
    // with no message of its own, so the issues are described here and kept in
    // the details for server-side use.
    const zodMessage = formatZodIssues(parsed?.zodError);

    if (zodMessage) {
      return {
        status: 422,
        message: zodMessage,
        category: "Unprocessable Entity error",
        details: parsed.zodError,
      };
    }
  } catch {
    // Not JSON
  }

  if (typeof error?.status === "number") {
    return {
      status: error.status,
      message,
      category: "Internal error",
      details,
    };
  }

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
