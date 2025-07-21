import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/billing/models/payment-intent/sdk/model";
import { action as provider } from "./provider";
import { action as check } from "./check";

export const api = {
  provider,
  check,
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
};
