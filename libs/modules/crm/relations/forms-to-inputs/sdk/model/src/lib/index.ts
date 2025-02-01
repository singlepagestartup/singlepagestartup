export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/crm/relations/forms-to-inputs/backend/repository/database";
import { BACKEND_URL, NextRequestOptions, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/crm/forms-to-inputs";
export const variants = ["default"] as const;
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
