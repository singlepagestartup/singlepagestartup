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
import { PermissionDI } from "./di";
import { Service as PermissionsToBillingModuleCurrenciesService } from "@sps/rbac/relations/permissions-to-billing-module-currencies/backend/app/api/src/lib/service/singlepage";
import { Repository as PermissionsToBillingModuleCurrenciesRepository } from "@sps/rbac/relations/permissions-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as PermissionsToBillingModuleCurrenciesConfiguration } from "@sps/rbac/relations/permissions-to-billing-module-currencies/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<PermissionsToBillingModuleCurrenciesService>(
    PermissionDI.IPermissionsToBillingModuleCurrenciesService,
  )
    .toDynamicValue(
      () =>
        new PermissionsToBillingModuleCurrenciesService(
          new PermissionsToBillingModuleCurrenciesRepository(
            new PermissionsToBillingModuleCurrenciesConfiguration(),
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
