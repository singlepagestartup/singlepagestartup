import { bootstrap } from "./lib/bootstrap";
const { app, service } = await bootstrap();
export { app, service };
export const configureOrderPayments =
  service.configureOrderPayments.bind(service);
export { bootstrap } from "./lib/bootstrap";
export type { IBootstrapResult } from "./lib/bootstrap";
export type { App } from "./lib/app";
export type { Service } from "./lib/service";
export type { IPaymentLifecycle } from "./lib/service/singlepage/settlement";
export type {
  IProviderPeriodReceipt,
  IProviderPeriodResolver,
} from "./lib/service/singlepage/settlement";
