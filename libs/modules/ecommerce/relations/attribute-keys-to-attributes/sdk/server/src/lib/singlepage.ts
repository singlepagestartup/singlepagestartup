import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
