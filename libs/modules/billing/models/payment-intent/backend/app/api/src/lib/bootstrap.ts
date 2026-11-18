import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
  defaultAppAssembly,
  DI,
  ExceptionFilter,
  type IAppAssembly,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { PaymentIntentDI, type IBillingModule } from "./di";
import { createModules } from "./service/modules";

export type IBootstrapResult = Awaited<ReturnType<typeof bootstrap>>;

export function createBillingModule(
  assembly: IAppAssembly = defaultAppAssembly,
): IBillingModule {
  return assembly.getOrCreate(createModules).billing;
}

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<IBillingModule>(PaymentIntentDI.IBillingModule)
    .toDynamicValue(({ get }) => createBillingModule(get(DI.IAppAssembly)))
    .inSingletonScope();
});

export const serviceBootstrap = createAppBootstrap<App, Service>(bindings);
export const { bootstrap, createService } = serviceBootstrap;
