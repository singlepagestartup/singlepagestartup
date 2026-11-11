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
import { TopicDI, type INotificationModule } from "./di";
import type { Service as NotificationService } from "@sps/notification/models/notification/backend/app/api/src/lib/service";
import { app as notificationApp } from "@sps/notification/models/notification/backend/app/api";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<INotificationModule>(TopicDI.INotificationModule)
    .toDynamicValue(() => {
      return {
        notification: notificationApp.controller.service as NotificationService,
      };
    })
    .inSingletonScope();
});

export async function bootstrap() {
  const container = new Container();
  container.load(bindings);
  const app = container.get<App>(DI.IApp);

  await app.init();

  return { app };
}
