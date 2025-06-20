import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/action/sdk/model";
import { action as findByRoute } from "./actions/find-by-route";
import { action as findByIdRoutes } from "./actions/find-by-id-routes";

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  findByRoute,
  findByIdRoutes,
};
