import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/host/relations/pages-to-widgets/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});
