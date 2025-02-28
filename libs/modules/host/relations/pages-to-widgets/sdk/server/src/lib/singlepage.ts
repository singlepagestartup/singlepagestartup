import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/host/relations/pages-to-widgets/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
