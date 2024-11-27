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
  "identities-default",
  "forgot-password",
  "login",
  "logout",
  "registration",
  "reset-password",
  "identities-update-default",
  "subject-overview-default",
  "subjects-list-default",
  "identities-create-default",
];
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
