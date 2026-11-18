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
import { createService as createArticleService } from "@sps/blog/models/article/backend/app/api/src/lib/bootstrap";
import { createService as createProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/bootstrap";
import { createService as createFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/bootstrap";
import { createService as createProfilesToArticlesService } from "@sps/social/relations/profiles-to-blog-module-articles/backend/app/api/src/lib/bootstrap";
import { createService as createProfilesToProductsService } from "@sps/social/relations/profiles-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { createService as createProfilesToFilesService } from "@sps/social/relations/profiles-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import type { IDependencies as IAuthorDependencies } from "./service/singlepage/authors";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<Omit<IAuthorDependencies, "profile">>(ProfileDI.IAuthorDependencies)
    .toDynamicValue(() => {
      return {
        article: createArticleService(),
        product: createProductService(),
        file: createFileService(),
        profilesToArticles: createProfilesToArticlesService(),
        profilesToProducts: createProfilesToProductsService(),
        profilesToFiles: createProfilesToFilesService(),
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

export const { bootstrap, createService } = createAppBootstrap<App, Service>(
  bindings,
);
