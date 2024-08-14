import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/website-builder/relations/widgets-to-navbar-blocks/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});