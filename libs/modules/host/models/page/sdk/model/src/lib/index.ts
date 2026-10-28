import type { ISelectSchema } from "@sps/host/models/page/backend/repository/database";
export {
  type IInsertSchema,
  type ISelectSchema as IModel,
  insertSchema,
  selectSchema,
} from "@sps/host/models/page/backend/repository/database";
import {
  type IRouteParams,
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/host/pages";
export const variants = ["hidden", "default"];
export const query = {};
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;

/** Computed routing response; routeParams is not stored on the Page table. */
export interface IResolvedPage extends ISelectSchema {
  routeParams: IRouteParams;
}
