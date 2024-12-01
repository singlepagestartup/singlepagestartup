import { factory } from "@sps/shared-frontend-server-api";
import {
  host,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/identity/sdk/model";
import { action as loginAndPassword } from "./actions/login-and-password";
import { action as changePassword } from "./actions/change-password";

export const api = {
  ...factory<IModel>({
    route,
    host,
    options,
    params: query,
  }),
  loginAndPassword,
  changePassword,
};
