import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/notification/relations/topics-to-notifications/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
