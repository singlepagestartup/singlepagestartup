import { bootstrap } from "./lib/bootstrap";
const { app } = await bootstrap();
export { app };
export { bootstrap } from "./lib/bootstrap";
export type { IBootstrapResult } from "./lib/bootstrap";
export type { App } from "./lib/app";
export type { Service } from "./lib/service";
export type { IPaymentLifecycle } from "./lib/service/singlepage/settlement";
export type {
  IProviderPeriodReceipt,
  IProviderPeriodResolver,
} from "./lib/service/singlepage/settlement";
