import { factory } from "@sps/shared-frontend-server-api";
import {
  host,
  route,
  IModel,
  query,
  options,
} from "@sps/file-storage/models/file/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
  params: query,
});
