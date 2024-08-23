import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/website-builder/relations/widgets-to-features/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});
