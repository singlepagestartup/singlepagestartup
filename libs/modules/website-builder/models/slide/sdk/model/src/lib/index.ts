export {
  type ISelectSchema as IModel,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/website-builder/models/slide/backend/repository/database";
import { BACKEND_URL, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/website-builder/slides";
export const variants = ["default"] as const;
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
};
