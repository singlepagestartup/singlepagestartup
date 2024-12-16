import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/host/relations/widgets-to-external-widgets/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});
