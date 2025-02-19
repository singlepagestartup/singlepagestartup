import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});
