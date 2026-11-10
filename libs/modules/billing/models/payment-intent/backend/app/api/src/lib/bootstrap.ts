import { Container, ContainerModule, interfaces } from "inversify";
import {
  DI,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { PaymentIntentDI, type IBillingModule } from "./di";
import { app as currencyApp } from "@sps/billing/models/currency/backend/app/api";
import { app as invoiceApp } from "@sps/billing/models/invoice/backend/app/api";
import { app as relationApp } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<IBillingModule>(PaymentIntentDI.IBillingModule)
    .toDynamicValue(() => {
      return {
        currency: currencyApp.controller.service,
        invoice: invoiceApp.controller.service,
        paymentIntentsToInvoices: relationApp.controller.service,
      };
    })
    .inSingletonScope();
});

export async function bootstrap() {
  const container = new Container({
    skipBaseClassChecks: true,
  });
  container.load(bindings);
  const app = container.get<App>(DI.IApp);

  await app.init();

  return { app };
}
