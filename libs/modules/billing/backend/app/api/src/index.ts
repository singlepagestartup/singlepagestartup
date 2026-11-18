import { bootstrap } from "./lib/bootstrap";
const { app } = await bootstrap();
export { app };
export { configureOrderPayments } from "@sps/billing/models/payment-intent/backend/app/api";
export { bootstrap } from "./lib/bootstrap";
export type { IBootstrapResult } from "./lib/bootstrap";
export type { App } from "./lib/app";
