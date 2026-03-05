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
import { AttributeDI } from "./di";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Repository as AttributesToBillingModuleCurrenciesRepository } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as AttributesToBillingModuleCurrenciesConfiguration } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as BillingModuleCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Repository as BillingModuleCurrencyRepository } from "@sps/billing/models/currency/backend/app/api/src/lib/repository";
import { Configuration as BillingModuleCurrencyConfiguration } from "@sps/billing/models/currency/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<AttributesToBillingModuleCurrenciesService>(
    AttributeDI.IAttributesToBillingModuleCurrenciesService,
  )
    .toDynamicValue(
      () =>
        new AttributesToBillingModuleCurrenciesService(
          new AttributesToBillingModuleCurrenciesRepository(
            new AttributesToBillingModuleCurrenciesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<BillingModuleCurrencyService>(AttributeDI.IBillingModuleCurrencyService)
    .toDynamicValue(
      () =>
        new BillingModuleCurrencyService(
          new BillingModuleCurrencyRepository(
            new BillingModuleCurrencyConfiguration(),
          ),
        ),
    )
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
