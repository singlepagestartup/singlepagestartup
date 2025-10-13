import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/social/relations/attribute-keys-to-attributes/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
