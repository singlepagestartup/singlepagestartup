import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  host,
  IModel,
  options,
} from "@sps/website-builder/relations/features-to-file-storage-module-files/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});
