import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/ecommerce/relations/orders-to-products/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
