import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/rbac/relations/subjects-to-roles/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
