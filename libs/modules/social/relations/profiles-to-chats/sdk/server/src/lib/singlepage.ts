import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/social/relations/profiles-to-chats/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
