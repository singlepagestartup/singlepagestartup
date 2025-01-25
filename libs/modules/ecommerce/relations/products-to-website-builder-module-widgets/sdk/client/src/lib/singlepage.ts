"use client";

import {
  IModel,
  route,
  host,
  options,
} from "@sps/ecommerce/relations/products-to-website-builder-module-widgets/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export const api = factory<IModel>({
  queryClient,
  route,
  host,
  options,
});
