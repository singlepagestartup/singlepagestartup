import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/identity/sdk/model";
import { action as emailAndPassword } from "./actions/email-and-password";
import { action as changePassword } from "./actions/change-password";

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  emailAndPassword,
  changePassword,
};
