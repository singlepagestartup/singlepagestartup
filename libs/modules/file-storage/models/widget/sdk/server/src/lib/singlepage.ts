import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/file-storage/models/widget/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
  params: query,
});
