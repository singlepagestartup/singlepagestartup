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
import { FormDI, type INotificationModule } from "./di";
import { Repository as NotificationTopicRepository } from "@sps/notification/models/topic/backend/app/api/src/lib/repository";
import { Configuration as NotificationTopicConfiguration } from "@sps/notification/models/topic/backend/app/api/src/lib/configuration";
import { Repository as NotificationTemplateRepository } from "@sps/notification/models/template/backend/app/api/src/lib/repository";
import { Configuration as NotificationTemplateConfiguration } from "@sps/notification/models/template/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<INotificationModule>(FormDI.INotificationModule)
    .toDynamicValue(() => {
      return {
        topic: new CRUDService<any>(
          new NotificationTopicRepository(new NotificationTopicConfiguration()),
        ),
        template: new CRUDService<any>(
          new NotificationTemplateRepository(
            new NotificationTemplateConfiguration(),
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
