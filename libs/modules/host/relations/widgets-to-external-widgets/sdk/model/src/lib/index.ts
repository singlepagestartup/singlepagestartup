export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/host/relations/widgets-to-external-widgets/backend/repository/database";
import { BACKEND_URL, NextRequestOptions, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/host/widgets-to-external-widgets";
export const variants = ["default"];
export const externalModules = [
  "agent",
  "billing",
  "blog",
  "broadcast",
  "crm",
  "ecommerce",
  "file-storage",
  "notification",
  "rbac",
  "startup",
  "website-builder",
];
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
