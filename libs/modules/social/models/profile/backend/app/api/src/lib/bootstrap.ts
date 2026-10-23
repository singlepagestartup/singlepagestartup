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
import { app as blogApp } from "@sps/blog/backend/app/api";
import { app as ecommerceApp } from "@sps/ecommerce/backend/app/api";
import { app as fileStorageApp } from "@sps/file-storage/backend/app/api";
import { app as profilesToArticlesApp } from "@sps/social/relations/profiles-to-blog-module-articles/backend/app/api";
import { app as profilesToProductsApp } from "@sps/social/relations/profiles-to-ecommerce-module-products/backend/app/api";
import { app as profilesToFilesApp } from "@sps/social/relations/profiles-to-file-storage-module-files/backend/app/api";
import type { IDependencies as IAuthorDependencies } from "./service/singlepage/authors";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<Omit<IAuthorDependencies, "profile">>(ProfileDI.IAuthorDependencies)
    .toDynamicValue(() => {
      const service = (module: unknown, route: string) => {
        const entries = (
          module as {
            apps: {
              apps: {
                route: string;
                app: { controller: { service: unknown } };
              }[];
            };
          }
        ).apps.apps;
        const found = entries.find((entry) => entry.route === route);
        if (!found)
          throw new Error(
            "Configuration error. Public author service is unavailable",
          );
        return found.app.controller.service;
      };
      return {
        article: service(blogApp, "/articles"),
        product: service(ecommerceApp, "/products"),
        file: service(fileStorageApp, "/files"),
        profilesToArticles: profilesToArticlesApp.controller.service,
        profilesToProducts: profilesToProductsApp.controller.service,
        profilesToFiles: profilesToFilesApp.controller.service,
      } as Omit<IAuthorDependencies, "profile">;
    })
    .inSingletonScope();
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

function createContainer() {
  const container = new Container({
    skipBaseClassChecks: true,
  });
  container.load(bindings);
  return container;
}

/** Creates the effective service graph without initializing HTTP routes. */
export function createService(): Service {
  return createContainer().get<Service>(DI.IService);
}

export async function bootstrap() {
  const container = createContainer();
  const app = container.get<App>(DI.IApp);

  await app.init();

  return { app };
}
