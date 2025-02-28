import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/file-storage/relations/widgets-to-files/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
