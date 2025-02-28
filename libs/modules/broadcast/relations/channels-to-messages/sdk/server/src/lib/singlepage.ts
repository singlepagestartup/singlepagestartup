import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  options,
} from "@sps/broadcast/relations/channels-to-messages/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
