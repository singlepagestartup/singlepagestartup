import { validate as isUuid } from "uuid";

export interface IValidateWebhookIdentifiersProps {
  data: unknown;
  uuidFields: string[];
  stringFields?: string[];
}

/**
 * Validates the identifiers of an external provider webhook payload before they
 * are used as filter values.
 *
 * A `uuidFields` entry must be a canonical uuid. The shared query builder
 * compares it with the uuid column as it arrives, and PostgreSQL rejects a
 * value that is not a uuid, which the error mapper answers as a 500 carrying
 * that value into the response, the log and the bug report. Checking it first
 * refuses it with a 400 before any query runs.
 *
 * A `stringFields` entry must be a string when the provider sends it. An empty
 * value is accepted, because providers echo fields that SPS never sets.
 *
 * Messages carry the `Validation error.` category so `getHttpErrorType` answers
 * 400, and never contain a received value.
 */
export function validateWebhookIdentifiers(
  props: IValidateWebhookIdentifiersProps,
): Record<string, string> {
  const { data, uuidFields, stringFields = [] } = props;

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Validation error. Invalid webhook payload");
  }

  const payload = data as Record<string, unknown>;
  const identifiers: Record<string, string> = {};

  for (const field of uuidFields) {
    const value = payload[field];

    if (typeof value !== "string" || !isUuid(value)) {
      throw new Error(`Validation error. Invalid ${field}`);
    }

    identifiers[field] = value;
  }

  for (const field of stringFields) {
    const value = payload[field];

    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value !== "string") {
      throw new Error(`Validation error. Invalid ${field}`);
    }

    identifiers[field] = value;
  }

  return identifiers;
}
