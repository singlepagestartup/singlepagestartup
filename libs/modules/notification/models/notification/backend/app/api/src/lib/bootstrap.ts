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

import {
  NotificationDI,
  type IBroadcastModule,
  type ITemplateService,
} from "./di";
import { createService as createBroadcastChannelService } from "@sps/broadcast/models/channel/backend/app/api/src/lib/bootstrap";

import { createService as createTemplateService } from "@sps/notification/models/template/backend/app/api/src/lib/bootstrap";

const bindings = new ContainerModule(({ bind }) => {
  bind<ITemplateService>(NotificationDI.ITemplateService)
    .toDynamicValue(() => createTemplateService())
    .inSingletonScope();
  bind<IBroadcastModule>(NotificationDI.IBroadcastModule)
    .toDynamicValue(() => ({
      channel: createBroadcastChannelService(),
    }))
    .inSingletonScope();
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
});

export const { bootstrap, createService } = createAppBootstrap<App, Service>(
  bindings,
);
