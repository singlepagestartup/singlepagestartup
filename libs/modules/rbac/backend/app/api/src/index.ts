import { bootstrap } from "./lib/bootstrap";
const { app } = await bootstrap();
export { app };
export { resolveOrderPaymentPeriod } from "@sps/rbac/models/subject/backend/app/api";
export type { IApp } from "./lib/app";
