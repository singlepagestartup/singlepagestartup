import type { z } from "zod";
import type {
  ISelectSchema,
  outputSchema,
} from "@sps/rbac/models/identity/backend/repository/database";
export {
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/rbac/models/identity/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/rbac/identities";
export const variants = ["default"];
export const providers = ["email_and_password", "telegram"];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;

/**
 * Columns the API returns only to a caller holding the operator secret: every
 * column of the stored row that `outputSchema` leaves out.
 */
type IOperatorOnlyColumn = Exclude<
  keyof ISelectSchema,
  keyof z.infer<typeof outputSchema>
>;

/**
 * An identity as the HTTP API returns it (issue #270). The operator-only
 * columns arrive only when the request carried the operator secret, so they
 * are optional here, and code that reads one checks first that it arrived.
 */
export type IModel = Omit<ISelectSchema, IOperatorOnlyColumn> &
  Partial<Pick<ISelectSchema, IOperatorOnlyColumn>>;
