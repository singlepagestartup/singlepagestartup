const UNIQUE_VIOLATION_CODE = "23505";
const uniqueViolationMessagePattern =
  /duplicate key value violates unique constraint/i;
const maxErrorChainDepth = 5;

type IErrorRecord = {
  code?: unknown;
  message?: unknown;
  cause?: unknown;
  causes?: unknown;
  payload?: unknown;
};

function asErrorRecord(value: unknown): IErrorRecord | undefined {
  if (typeof value === "object" && value !== null) {
    return value as IErrorRecord;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);

    return typeof parsed === "object" && parsed !== null
      ? (parsed as IErrorRecord)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Reports whether an error is a PostgreSQL unique-constraint violation,
 * including one wrapped by the API response pipe into an HTTPException whose
 * message carries the serialized error payload.
 */
export function util(error: unknown, depth = 0): boolean {
  if (depth > maxErrorChainDepth || error === undefined || error === null) {
    return false;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (uniqueViolationMessagePattern.test(message)) {
    return true;
  }

  const record = asErrorRecord(error) ?? asErrorRecord(message);

  if (!record) {
    return false;
  }

  if (String(record.code) === UNIQUE_VIOLATION_CODE) {
    return true;
  }

  if (
    typeof record.message === "string" &&
    uniqueViolationMessagePattern.test(record.message)
  ) {
    return true;
  }

  for (const candidate of [record.cause, record.causes, record.payload]) {
    if (Array.isArray(candidate)) {
      if (candidate.some((entry) => util(entry, depth + 1))) {
        return true;
      }

      continue;
    }

    if (util(candidate, depth + 1)) {
      return true;
    }
  }

  return false;
}
