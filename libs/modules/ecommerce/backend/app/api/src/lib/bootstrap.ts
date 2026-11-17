import { App } from "./app";
import type { Apps } from "./apps";
import {
  DI,
  ExceptionFilter,
  IModuleApp,
  IExceptionFilter,
} from "@sps/shared-backend-api";
import { Container, ContainerModule } from "inversify";
import {
  bootstrap as bootstrapBilling,
  type App as BillingApp,
} from "@sps/billing/backend/app/api";
import { billingPaymentIntentApp } from "@sps/ecommerce/models/order/backend/app/api";

export interface IBootstrapResult {
  app: IModuleApp<Apps>;
  billingApp: BillingApp;
}

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<IModuleApp<Apps>>(DI.IApp).to(App);
});

export async function bootstrap(): Promise<IBootstrapResult> {
  const container = new Container();
  container.load(bindings);

  const app = container.get<IModuleApp<Apps>>(DI.IApp);
  await app.init();
  const { app: billingApp } = await bootstrapBilling(billingPaymentIntentApp);

  return { app, billingApp };
}
