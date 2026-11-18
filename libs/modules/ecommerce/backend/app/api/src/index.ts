import { bootstrap } from "./lib/bootstrap";
const { app } = await bootstrap();
export { app };
export { orderPaymentLifecycle } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api";
