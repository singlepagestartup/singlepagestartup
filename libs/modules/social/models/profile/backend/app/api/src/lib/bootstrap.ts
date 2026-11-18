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
import { createModules } from "./service/modules";
import { ProfileDI } from "./di";
import type { IDependencies as IAuthorDependencies } from "./service/singlepage/authors";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
});

export const serviceBootstrap = createAppBootstrap<App, Service>(
  bindings,
  (container, assembly) => {
    const { blog, ecommerce, fileStorage, social } =
      assembly.getOrCreate(createModules);
    container
      .bind<Omit<IAuthorDependencies, "profile">>(ProfileDI.IAuthorDependencies)
      .toDynamicValue(() => ({
        get article() {
          return blog.article;
        },
        get product() {
          return ecommerce.product;
        },
        get file() {
          return fileStorage.file;
        },
        get profilesToArticles() {
          return social.profilesToBlogModuleArticles;
        },
        get profilesToProducts() {
          return social.profilesToEcommerceModuleProducts;
        },
        get profilesToFiles() {
          return social.profilesToFileStorageModuleFiles;
        },
      }))
      .inSingletonScope();
    container
      .bind(ProfileDI.IChatsService)
      .toDynamicValue(() => social.chat)
      .inSingletonScope();
    container
      .bind(ProfileDI.IProfilesToChatsService)
      .toDynamicValue(() => social.profilesToChats)
      .inSingletonScope();
  },
);
export const { bootstrap, createService } = serviceBootstrap;
