import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/telegram/relations/pages-to-widgets/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
