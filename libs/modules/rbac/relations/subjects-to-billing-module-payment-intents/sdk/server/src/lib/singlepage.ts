import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/rbac/relations/subjects-to-billing-module-payment-intents/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
