import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  serverHost,
  IModel,
  options,
} from "@sps/website-builder/relations/buttons-to-file-storage-module-files/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
