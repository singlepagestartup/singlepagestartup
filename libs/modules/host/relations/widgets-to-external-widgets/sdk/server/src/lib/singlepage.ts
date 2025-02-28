import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/host/relations/widgets-to-external-widgets/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
