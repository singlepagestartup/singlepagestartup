import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/blog/relations/articles-to-file-storage-module-files/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
