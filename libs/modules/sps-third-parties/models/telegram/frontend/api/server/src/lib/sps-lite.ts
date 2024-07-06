import { factory } from "@sps/shared-frontend-server-api";
import {
  host,
  route,
  IModelExtended,
  query,
  options,
} from "@sps/sps-third-parties/models/telegram/frontend/api/model";

export const api = factory<IModelExtended>({
  route,
  host,
  options,
  params: query,
});
