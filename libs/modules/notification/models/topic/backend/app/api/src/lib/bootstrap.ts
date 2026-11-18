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
import { TopicDI, type INotificationModule } from "./di";
import { createService as createNotificationService } from "@sps/notification/models/notification/backend/app/api/src/lib/bootstrap";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<INotificationModule>(TopicDI.INotificationModule)
    .toDynamicValue(() => {
      return {
        notification: createNotificationService(),
      };
    })
    .inSingletonScope();
});

export const { bootstrap, createService } = createAppBootstrap<App, Service>(
  bindings,
);
