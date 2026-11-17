import { Container, ContainerModule } from "inversify";
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
import type { IPaymentLifecycle } from "./service/singlepage/settlement";
import { Service as BillingCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Repository as BillingCurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as BillingCurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";
import { Service as BillingInvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import { Repository as BillingInvoiceRepository } from "@sps/billing/models/invoice/backend/app/api/src/lib/repository";
import { Configuration as BillingInvoiceConfiguration } from "@sps/billing/models/invoice/backend/app/api/src/lib/configuration";
import { Service as BillingPaymentIntentsToInvoicesService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/service";
import { Repository as BillingPaymentIntentsToInvoicesRepository } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/repository";
import { Configuration as BillingPaymentIntentsToInvoicesConfiguration } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/configuration";

export interface IBootstrapResult {
  app: App;
  service: Service;
}

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<IBillingModule>(PaymentIntentDI.IBillingModule)
    .toDynamicValue(() => {
      return {
        currency: new BillingCurrencyService(
          new BillingCurrencyRepository(new BillingCurrencyConfiguration()),
        ),
        invoice: new BillingInvoiceService(
          new BillingInvoiceRepository(new BillingInvoiceConfiguration()),
        ),
        paymentIntentsToInvoices: new BillingPaymentIntentsToInvoicesService(
          new BillingPaymentIntentsToInvoicesRepository(
            new BillingPaymentIntentsToInvoicesConfiguration(),
          ),
        ),
      };
    })
    .inSingletonScope();
});

export async function bootstrap(
  paymentLifecycle?: IPaymentLifecycle,
): Promise<IBootstrapResult> {
  const container = new Container();
  container.load(bindings);
  if (paymentLifecycle) {
    container
      .bind<IPaymentLifecycle>(PaymentIntentDI.IPaymentLifecycle)
      .toConstantValue(paymentLifecycle);
  }
  const app = container.get<App>(DI.IApp);
  const service = container.get<Service>(DI.IService);

  await app.init();

  return { app, service };
}
