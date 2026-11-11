import { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";
import { Repository as RolesToPermissionsRepository } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/repository";
import { Configuration as RolesToPermissionsConfiguration } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/configuration";
import { RoleDI } from "./di";
import { app as permissionApp } from "@sps/rbac/models/permission/backend/app/api";
import type { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import { Container, ContainerModule } from "inversify";
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
    .toDynamicValue(() => permissionApp.controller.service as PermissionService)
    .inSingletonScope();
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
});

export async function bootstrap() {
  const container = new Container();
  container.load(bindings);
  const app = container.get<App>(DI.IApp);

  await app.init();

  return { app };
}
