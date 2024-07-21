export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/sps-website-builder/models/navbar/backend/schema/table";
import { BACKEND_URL, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/sps-website-builder/navbars";
export const host = BACKEND_URL;
export const variants = ["default"] as const;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
};