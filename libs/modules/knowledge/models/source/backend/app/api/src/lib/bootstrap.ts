import { createKnowledgeServices } from "@sps/knowledge/backend/app/api/src/lib/composition";
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

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).toDynamicValue(
    () => createKnowledgeServices().source,
  );
  bind<Configuration>(DI.IConfiguration).to(Configuration);
});

export const { bootstrap, createService } = createAppBootstrap<App, Service>(
  bindings,
);
