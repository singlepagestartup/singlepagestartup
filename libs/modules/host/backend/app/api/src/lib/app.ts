import "reflect-metadata";
import {
  DI,
  defaultAppAssembly,
  ModuleApp,
  type IAppAssembly,
  type IExceptionFilter,
  type IDefaultApp,
  type IModuleApp,
} from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";
import { configurePageRouteSources } from "@sps/host/models/page/backend/app/api/src/lib/service/singlepage/routing";

export function configureHostRouting(
  assembly: IAppAssembly,
  modules: Record<string, Pick<IDefaultApp, "describeRoutes">>,
): void {
  configurePageRouteSources(assembly, () =>
    Object.entries(modules).flatMap(([name, module]) =>
      module.describeRoutes().map(({ route, resource }) => ({
        name: name + "." + route.slice(1),
        route: "/api/" + name + route,
        resource,
      })),
    ),
  );
}

export interface IApp extends IModuleApp<Apps> {
  configureRouting(
    modules: Record<string, Pick<IDefaultApp, "describeRoutes">>,
  ): void;
}

@injectable()
export class App extends ModuleApp<Apps> implements IApp {
  constructor(
    @inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter,
    @inject(DI.IAppAssembly)
    private readonly assembly: IAppAssembly = defaultAppAssembly,
  ) {
    super(exceptionFilter, () => new Apps(assembly));
  }

  configureRouting(
    modules: Record<string, Pick<IDefaultApp, "describeRoutes">>,
  ) {
    configureHostRouting(this.assembly, modules);
  }
}
