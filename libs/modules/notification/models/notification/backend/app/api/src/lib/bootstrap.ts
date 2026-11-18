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
import { createModules } from "./service/modules";
import {
  NotificationDI,
  type IBroadcastModule,
  type ITemplateService,
} from "./di";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
});

export const serviceBootstrap = createAppBootstrap<App, Service>(
  bindings,
  (container, assembly) => {
    const { notification, broadcast } = assembly.getOrCreate(createModules);
    container
      .bind<ITemplateService>(NotificationDI.ITemplateService)
      .toDynamicValue(() => notification.template)
      .inSingletonScope();
    container
      .bind<IBroadcastModule>(NotificationDI.IBroadcastModule)
      .toDynamicValue(() => ({
        get channel() {
          return broadcast.channel;
        },
      }))
      .inSingletonScope();
  },
);
export const { bootstrap, createService } = serviceBootstrap;
