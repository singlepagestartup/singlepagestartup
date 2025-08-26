import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
