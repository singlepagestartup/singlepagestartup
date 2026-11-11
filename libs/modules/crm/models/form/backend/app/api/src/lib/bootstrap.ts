import { Service as RequestService } from "@sps/crm/models/request/backend/app/api/src/lib/service";
import { Repository as RequestRepository } from "@sps/crm/models/request/backend/app/api/src/lib/repository";
import { Configuration as RequestConfiguration } from "@sps/crm/models/request/backend/app/api/src/lib/configuration";
import { Service as FormsToRequestsService } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/service";
import { Repository as FormsToRequestsRepository } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/repository";
import { Configuration as FormsToRequestsConfiguration } from "@sps/crm/relations/forms-to-requests/backend/app/api/src/lib/configuration";
import { Container, ContainerModule } from "inversify";
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
import {
  FormDI,
  type INotificationModule,
  type ISubmissionServices,
} from "./di";
import { Repository as NotificationTopicRepository } from "@sps/notification/models/topic/backend/app/api/src/lib/repository";
import { Configuration as NotificationTopicConfiguration } from "@sps/notification/models/topic/backend/app/api/src/lib/configuration";
import { Repository as NotificationTemplateRepository } from "@sps/notification/models/template/backend/app/api/src/lib/repository";
import { Configuration as NotificationTemplateConfiguration } from "@sps/notification/models/template/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<ISubmissionServices>(FormDI.ISubmissionServices)
    .toDynamicValue(() => ({
      request: new RequestService(
        new RequestRepository(new RequestConfiguration()),
      ),
      formsToRequests: new FormsToRequestsService(
        new FormsToRequestsRepository(new FormsToRequestsConfiguration()),
      ),
    }))
    .inSingletonScope();
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
  const container = new Container();
  container.load(bindings);
  const app = container.get<App>(DI.IApp);

  await app.init();

  return { app };
}
