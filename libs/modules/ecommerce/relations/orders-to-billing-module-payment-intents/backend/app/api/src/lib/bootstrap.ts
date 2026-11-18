import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
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
import { OrdersToBillingModulePaymentIntentsDI } from "./di";
import { createService as createAttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/bootstrap";
import type { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";

export type IBootstrapResult = Awaited<ReturnType<typeof bootstrap>>;

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<AttributeService>(
    OrdersToBillingModulePaymentIntentsDI.IAttributeService,
  )
    .toDynamicValue(({ get }) =>
      createAttributeService(get<IAppAssembly>(DI.IAppAssembly)),
    )
    .inSingletonScope();
});

export const serviceBootstrap = createAppBootstrap<App, Service>(bindings);
export const { bootstrap, createService } = serviceBootstrap;
