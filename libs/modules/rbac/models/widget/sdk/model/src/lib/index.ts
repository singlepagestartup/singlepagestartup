export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/rbac/models/widget/backend/repository/database";
import { BACKEND_URL, NextRequestOptions, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/rbac/widgets";
export const variants = [
  "default",
  "subject-authentication-email-and-password-forgot-password-form-default",
  "subject-authentication-select-method-default",
  "subject-authentication-email-and-password-registration-form-default",
  "subject-authentication-email-and-password-reset-password-form-default",
  "subject-overview-default",
  "subject-list-default",
  "subject-identity-settings-default",
  "subject-authentication-logout-action-default",
];
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
