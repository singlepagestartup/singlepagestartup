export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/sps-billing/models/widget/backend/repository/database";
import { BACKEND_URL, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/sps-billing/widgets";
export const variants = ["default"];
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
};