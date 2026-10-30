import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  type IModel,
  query,
  options,
} from "@sps/host/models/metadata/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  params: query,
  options,
});
