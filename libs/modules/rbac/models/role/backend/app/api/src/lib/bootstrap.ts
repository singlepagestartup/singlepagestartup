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
import { RoleDI } from "./di";

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
    const { rbac } = assembly.getOrCreate(createModules);
    container
      .bind(RoleDI.IRolesToPermissionsService)
      .toDynamicValue(() => rbac.rolesToPermissions)
      .inSingletonScope();
    container
      .bind(RoleDI.IPermissionService)
      .toDynamicValue(() => rbac.permission)
      .inSingletonScope();
  },
);
export const { bootstrap, createService } = serviceBootstrap;
