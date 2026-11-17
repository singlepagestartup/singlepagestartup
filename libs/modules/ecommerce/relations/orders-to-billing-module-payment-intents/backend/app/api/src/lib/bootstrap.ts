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
import { OrdersToBillingModulePaymentIntentsDI } from "./di";
import { createService as createAttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/bootstrap";
import type { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";

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
  bind<AttributeService>(
    OrdersToBillingModulePaymentIntentsDI.IAttributeService,
  )
    .toDynamicValue(() => createAttributeService())
    .inSingletonScope();
});

export function createService(): Service {
  const container = new Container();
  container.load(bindings);
  return container.get<Service>(DI.IService);
}

export async function bootstrap(): Promise<IBootstrapResult> {
  const container = new Container();
  container.load(bindings);
  const app = container.get<App>(DI.IApp);
  const service = container.get<Service>(DI.IService);

  await app.init();

  return { app, service };
}
