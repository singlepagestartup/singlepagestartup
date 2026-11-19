import { mutateSourceAttachment } from "@sps/knowledge/backend/app/api/src/lib/composition/attachment-mutation";
import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
  DI,
  ExceptionFilter,
  type IAppAssembly,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService)
    .to(Service)
    .inSingletonScope()
    .onActivation(({ get }, service) => {
      const assembly = get<IAppAssembly>(DI.IAppAssembly);
      service.configure({
        inTransaction: false,
        mutate(operation) {
          return mutateSourceAttachment(assembly, operation);
        },
      });
      return service;
    });
  bind<Configuration>(DI.IConfiguration).to(Configuration);
});

export const serviceBootstrap = createAppBootstrap<App, Service>(bindings);
export const { bootstrap, createService } = serviceBootstrap;
