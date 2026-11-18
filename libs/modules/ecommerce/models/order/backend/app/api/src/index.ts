import { bootstrapWithService } from "./lib/bootstrap";
import { service as ordersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api";
import { service as paymentIntentService } from "@sps/billing/models/payment-intent/backend/app/api";
const { app, service } = await bootstrapWithService(
  ordersToBillingModulePaymentIntentsService,
  paymentIntentService,
);
export { app, service };
