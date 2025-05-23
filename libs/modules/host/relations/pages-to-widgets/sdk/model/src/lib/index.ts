export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/host/relations/pages-to-widgets/backend/repository/database";
import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/host/pages-to-widgets";
export const variants = ["default"];
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
