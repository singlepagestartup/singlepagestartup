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
import { ProfileDI } from "./di";
import { Service as ChatService } from "@sps/social/models/chat/backend/app/api/src/lib/service";
import { Repository as ChatRepository } from "@sps/social/models/chat/backend/app/api/src/lib/repository";
import { Configuration as ChatConfiguration } from "@sps/social/models/chat/backend/app/api/src/lib/configuration";
import { Service as MessageService } from "@sps/social/models/message/backend/app/api/src/lib/service";
import { Repository as MessageRepository } from "@sps/social/models/message/backend/app/api/src/lib/repository";
import { Configuration as MessageConfiguration } from "@sps/social/models/message/backend/app/api/src/lib/configuration";
import { Service as ChatsToMessagesService } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/service";
import { Repository as ChatsToMessagesRepository } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/repository";
import { Configuration as ChatsToMessagesConfiguration } from "@sps/social/relations/chats-to-messages/backend/app/api/src/lib/configuration";
import { Service as ProfilesToChatsService } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/service";
import { Repository as ProfilesToChatsRepository } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/repository";
import { Configuration as ProfilesToChatsConfiguration } from "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<ChatService>(ProfileDI.IChatsService)
    .toDynamicValue(
      () =>
        new ChatService(
          new ChatRepository(new ChatConfiguration()),
          new MessageService(new MessageRepository(new MessageConfiguration())),
          new ChatsToMessagesService(
            new ChatsToMessagesRepository(new ChatsToMessagesConfiguration()),
          ),
        ),
    )
    .inSingletonScope();
  bind<ProfilesToChatsService>(ProfileDI.IProfilesToChatsService)
    .toDynamicValue(
      () =>
        new ProfilesToChatsService(
          new ProfilesToChatsRepository(new ProfilesToChatsConfiguration()),
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
