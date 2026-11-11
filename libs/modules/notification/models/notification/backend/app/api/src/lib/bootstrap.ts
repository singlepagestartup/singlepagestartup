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

import type { Service as BroadcastChannelService } from "@sps/broadcast/models/channel/backend/app/api/src/lib/service";
import {
  NotificationDI,
  type IBroadcastModule,
  type ITemplateService,
} from "./di";
import { app as broadcastChannelApp } from "@sps/broadcast/models/channel/backend/app/api";

import type { Service as TemplateService } from "@sps/notification/models/template/backend/app/api/src/lib/service";
import { app as templateApp } from "@sps/notification/models/template/backend/app/api";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<ITemplateService>(NotificationDI.ITemplateService)
    .toDynamicValue(() => templateApp.controller.service as TemplateService)
    .inSingletonScope();
  bind<IBroadcastModule>(NotificationDI.IBroadcastModule)
    .toDynamicValue(() => ({
      channel: broadcastChannelApp.controller
        .service as BroadcastChannelService,
    }))
    .inSingletonScope();
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
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
