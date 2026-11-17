import { bootstrap } from "./lib/bootstrap";
const { app, billingApp } = await bootstrap();
export { app, billingApp };
