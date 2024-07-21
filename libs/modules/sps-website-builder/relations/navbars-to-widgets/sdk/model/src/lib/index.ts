export {
  type ISelectSchema as IRelation,
  type IInsertSchema,
  insertSchema,
  selectSchema,
} from "@sps/sps-website-builder/relations/navbars-to-widgets/backend/schema/root";
import { BACKEND_URL, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/sps-website-builder/navbars-to-widgets";
export const variants = ["default"] as const;
export const host = BACKEND_URL;
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
};