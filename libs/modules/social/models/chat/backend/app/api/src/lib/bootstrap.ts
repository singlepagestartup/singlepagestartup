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
import { ChatDI } from "./di";
import { Service as MessageService } from "@sps/social/models/message/backend/app/api/src/lib/service";
import { Repository as MessageRepository } from "@sps/social/models/message/backend/app/api/src/lib/repository";
import { Configuration as MessageConfiguration } from "@sps/social/models/message/backend/app/api/src/lib/configuration";
import { Service as ChatsToMessagesService } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/service";
import { Repository as ChatsToMessagesRepository } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/repository";
import { Configuration as ChatsToMessagesConfiguration } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<MessageService>(ChatDI.IMessagesService)
    .toDynamicValue(
      () =>
        new MessageService(new MessageRepository(new MessageConfiguration())),
    )
    .inSingletonScope();
  bind<ChatsToMessagesService>(ChatDI.IChatsToMessagesService)
    .toDynamicValue(
      () =>
        new ChatsToMessagesService(
          new ChatsToMessagesRepository(new ChatsToMessagesConfiguration()),
        ),
    )
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
