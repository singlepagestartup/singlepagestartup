export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/host/relations/pages-to-widgets/backend/repository/database";
import { BACKEND_URL, REVALIDATE } from "@sps/shared-utils";

export const route = "/api/host/pages-to-widgets";
export const variants = ["default"];
export const host = BACKEND_URL;
export const query = {
  params: {
    orderBy: {
      and: [
        {
          column: "orderIndex",
          method: "asc",
        },
      ],
    },
  },
};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;
