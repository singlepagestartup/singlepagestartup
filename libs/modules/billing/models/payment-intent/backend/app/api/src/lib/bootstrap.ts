import { Container, ContainerModule, interfaces } from "inversify";
import {
  CRUDService,
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
import { Repository as BillingCurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as BillingCurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";
import { Repository as BillingInvoiceRepository } from "@sps/billing/models/invoice/backend/app/api/src/lib/repository";
import { Configuration as BillingInvoiceConfiguration } from "@sps/billing/models/invoice/backend/app/api/src/lib/configuration";
import { Repository as BillingPaymentIntentsToInvoicesRepository } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/repository";
import { Configuration as BillingPaymentIntentsToInvoicesConfiguration } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/configuration";

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
        currency: new CRUDService<any>(
          new BillingCurrencyRepository(new BillingCurrencyConfiguration()),
        ),
        invoice: new CRUDService<any>(
          new BillingInvoiceRepository(new BillingInvoiceConfiguration()),
        ),
        paymentIntentsToInvoices: new CRUDService<any>(
          new BillingPaymentIntentsToInvoicesRepository(
            new BillingPaymentIntentsToInvoicesConfiguration(),
          ),
        ),
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
