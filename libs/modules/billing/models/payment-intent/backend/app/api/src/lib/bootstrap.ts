import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
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
import { Service as BillingCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Repository as BillingCurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as BillingCurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";
import { Service as BillingInvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import { Repository as BillingInvoiceRepository } from "@sps/billing/models/invoice/backend/app/api/src/lib/repository";
import { Configuration as BillingInvoiceConfiguration } from "@sps/billing/models/invoice/backend/app/api/src/lib/configuration";
import { Service as BillingPaymentIntentsToInvoicesService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/service";
import { Repository as BillingPaymentIntentsToInvoicesRepository } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/repository";
import { Configuration as BillingPaymentIntentsToInvoicesConfiguration } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/configuration";

export type IBootstrapResult = Awaited<ReturnType<typeof bootstrap>>;

export function createBillingModule(): IBillingModule {
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
}

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<IBillingModule>(PaymentIntentDI.IBillingModule)
    .toDynamicValue(createBillingModule)
    .inSingletonScope();
});

export const { bootstrap, createService } = createAppBootstrap<App, Service>(
  bindings,
);
