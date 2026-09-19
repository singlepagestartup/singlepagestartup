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
 * rewrites an `eq` filter on a uuid column into a text `LIKE` when the value is
 * not a canonical uuid, so an unvalidated identifier either matches unrelated
 * rows or silently returns nothing. The same `validate` predicate is used here
 * and in `libs/shared/backend/api/src/lib/query-builder/filters.ts`.
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
