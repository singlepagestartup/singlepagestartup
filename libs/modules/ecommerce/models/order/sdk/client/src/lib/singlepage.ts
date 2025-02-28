"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/ecommerce/models/order/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import { action } from "./mutations/checkout";

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  action,
};
