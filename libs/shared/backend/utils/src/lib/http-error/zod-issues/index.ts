const maxReportedIssues = 3;

/**
 * Zod names the received type for a type mismatch, which is safe to repeat, but
 * quotes the received value for codes such as `invalid_enum_value`. That value
 * is request data, so the trailing segment that carries it is dropped before
 * the text becomes a client-facing message.
 */
const receivedValuePattern = /,?\s*received\s+(['"]).*\1[.]?\s*$/i;

type IZodIssue = {
  path?: unknown;
  message?: unknown;
};

function asIssues(payload: unknown): IZodIssue[] | undefined {
  if (Array.isArray(payload)) {
    return payload as IZodIssue[];
  }

  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const issues = (payload as { issues?: unknown }).issues;

  return Array.isArray(issues) ? (issues as IZodIssue[]) : undefined;
}

function describePath(path: unknown): string {
  if (!Array.isArray(path)) {
    return "";
  }

  return path
    .filter(
      (segment) => typeof segment === "string" || typeof segment === "number",
    )
    .join(".");
}

function describeIssue(issue: IZodIssue): string {
  const message =
    typeof issue.message === "string" && issue.message
      ? issue.message.replace(receivedValuePattern, "")
      : "Invalid value";
  const path = describePath(issue.path);

  return path ? `${path}: ${message}` : message;
}

/**
 * Turns the issue list the shared repository serializes as `{ zodError }` into
 * one readable message. Without it the payload reaches the exception filter as
 * JSON with no `message` key, and the client receives an empty error text.
 */
export function util(payload: unknown): string | undefined {
  const issues = asIssues(payload);

  if (!issues?.length) {
    return undefined;
  }

  const described = issues.slice(0, maxReportedIssues).map(describeIssue);
  const remaining = issues.length - described.length;
  const suffix = remaining > 0 ? `; and ${remaining} more` : "";

  return `Unprocessable Entity error. ${described.join("; ")}${suffix}`;
}
