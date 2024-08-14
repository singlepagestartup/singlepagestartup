import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  host,
  options,
} from "@sps/website-builder/relations/features-to-buttons-arrays/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
});