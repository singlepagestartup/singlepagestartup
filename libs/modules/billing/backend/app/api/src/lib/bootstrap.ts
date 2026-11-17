import { App } from "./app";
import { Apps } from "./apps";
import type { App as PaymentIntentApp } from "@sps/billing/models/payment-intent/backend/app/api";
import {
  DI,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Container, ContainerModule } from "inversify";

export interface IBootstrapResult {
  app: App;
}

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
});

export async function bootstrap(
  paymentIntentApp?: PaymentIntentApp,
): Promise<IBootstrapResult> {
  const container = new Container();
  container.load(bindings);
  container.bind<Apps>(Apps).toDynamicValue(() => new Apps(paymentIntentApp));

  const app = container.get<App>(DI.IApp);
  await app.init();

  return { app };
}
