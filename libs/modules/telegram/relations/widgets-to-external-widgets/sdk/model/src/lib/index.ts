export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/telegram/relations/widgets-to-external-widgets/backend/repository/database";
import { BACKEND_URL, NextRequestOptions, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/telegram/widgets-to-external-widgets";
export const variants = ["default"];
export const externalModules = [
  "billing",
  "blog",
  "ecommerce",
  "website-builder",
  "rbac",
  "startup",
];
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
