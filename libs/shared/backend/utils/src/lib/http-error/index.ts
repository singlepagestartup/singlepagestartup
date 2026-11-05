import { ContentfulStatusCode } from "hono/utils/http-status";
import { httpErrorPatterns } from "./paterns";
import { categoryStatus, type ErrorCategory, type UtilsProp } from "./type";
import { parseCategoryFromMessage } from "./parser";
import { extractMessage, extractOriginalError } from "./extract";
import { util as sanitizeMessage } from "./sanitize";
import { util as formatZodIssues } from "./zod-issues";
import { util as isUniqueConstraintError } from "../unique-constraint-error";

function errorStatus(value: unknown): ContentfulStatusCode | undefined {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 400 &&
    value < 600
    ? (value as ContentfulStatusCode)
    : undefined;
}

function categoryForStatus(status: ContentfulStatusCode): ErrorCategory {
  if (status >= 500) return "Internal error";
  if (status === 413) return "Validation error";
  return (
    (Object.keys(categoryStatus) as ErrorCategory[]).find(
      (category) => categoryStatus[category] === status,
    ) ?? "Other"
  );
}

export function util(error: any): UtilsProp {
  let message = sanitizeMessage(extractMessage(error) || "Unknown error");
  let details = extractOriginalError(error);
  let status = errorStatus(error?.status);

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
    if (errorStatus(parsed?.status) && typeof parsed.message === "string") {
      status ??= errorStatus(parsed.status);
      message = sanitizeMessage(parsed.message);
      details = parsed.cause ?? details;
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

  const declared = parseCategoryFromMessage(message);
  if (declared) {
    return {
      status: status ?? categoryStatus[declared.category],
      ...declared,
      details,
    };
  }

  if (status) {
    return { status, message, category: categoryForStatus(status), details };
  }

  for (const entry of httpErrorPatterns) {
    if (entry.patterns.some((regex) => regex.test(message))) {
      return {
        status: entry.status,
        message,
        category: entry.category,
        details,
      };
    }
  }

  return { status: 500, message, category: "Internal error", details };
}
