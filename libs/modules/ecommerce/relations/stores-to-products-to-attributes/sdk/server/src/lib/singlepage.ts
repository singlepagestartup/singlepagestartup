import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/ecommerce/relations/stores-to-products-to-attributes/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});