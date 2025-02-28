import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/website-builder/relations/widgets-to-features/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
