import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/ecommerce/relations/products-to-website-builder-module-widgets/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});
