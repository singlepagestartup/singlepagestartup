"use client";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/ecommerce/models/attribute/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export const api = factory<IModel>({
  queryClient,
  route,
  host: clientHost,
  params: query,
  options,
});
