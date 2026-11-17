import { bootstrap } from "./lib/bootstrap";
import { service as ordersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api";
const { app, billingPaymentIntentApp, orderPaymentIntentService } =
  await bootstrap(ordersToBillingModulePaymentIntentsService);
export { app, billingPaymentIntentApp, orderPaymentIntentService };
