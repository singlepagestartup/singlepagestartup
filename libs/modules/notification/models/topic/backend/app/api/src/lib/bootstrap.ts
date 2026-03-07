import { Container, ContainerModule, interfaces } from "inversify";
import {
  CRUDService,
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
import { Repository as NotificationNotificationRepository } from "@sps/notification/models/notification/backend/app/api/src/lib/repository";
import { Configuration as NotificationNotificationConfiguration } from "@sps/notification/models/notification/backend/app/api/src/lib/configuration";
import { Repository as NotificationTopicsToNotificationsRepository } from "@sps/notification/relations/topics-to-notifications/backend/app/api/src/lib/repository";
import { Configuration as NotificationTopicsToNotificationsConfiguration } from "@sps/notification/relations/topics-to-notifications/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<INotificationModule>(TopicDI.INotificationModule)
    .toDynamicValue(() => {
      return {
        notification: new CRUDService<any>(
          new NotificationNotificationRepository(
            new NotificationNotificationConfiguration(),
          ),
        ),
        topicsToNotifications: new CRUDService<any>(
          new NotificationTopicsToNotificationsRepository(
            new NotificationTopicsToNotificationsConfiguration(),
          ),
        ),
      };
    })
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
