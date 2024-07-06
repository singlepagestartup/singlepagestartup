import { factory } from "@sps/shared-frontend-server-api";
import {
  host,
  route,
  IModelExtended,
  query,
  options,
} from "@sps/sps-host/models/layout/frontend/api/model";

export const api = factory<IModelExtended>({
  route,
  host,
  options,
  params: query,
});
