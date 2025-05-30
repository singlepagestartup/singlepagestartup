import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/telegram/models/page/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
  params: query,
});
