export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/website-builder/relations/features-to-buttons-arrays/backend/repository/database";
import { BACKEND_URL, NextRequestOptions, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/website-builder/features-to-buttons-arrays";
export const variants = ["default"] as const;
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
