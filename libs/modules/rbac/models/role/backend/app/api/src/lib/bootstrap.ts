import { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";
import { Repository as RolesToPermissionsRepository } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/repository";
import { Configuration as RolesToPermissionsConfiguration } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/configuration";
import { RoleDI } from "./di";
import { createService as createPermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/bootstrap";
import type { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
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
  bind<RolesToPermissionsService>(RoleDI.IRolesToPermissionsService)
    .toDynamicValue(
      () =>
        new RolesToPermissionsService(
          new RolesToPermissionsRepository(
            new RolesToPermissionsConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<PermissionService>(RoleDI.IPermissionService)
    .toDynamicValue(() => createPermissionService())
    .inSingletonScope();
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
});

export const { bootstrap, createService } = createAppBootstrap<App, Service>(
  bindings,
);
