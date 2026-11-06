import "reflect-metadata";
import {
  DI,
  ModuleApp,
  type IExceptionFilter,
  type IDefaultApp,
  type IModuleApp,
} from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";

export interface IApp extends IModuleApp<Apps> {
  configureRouting(
    modules: Record<string, Pick<IDefaultApp, "describeRoutes">>,
  ): void;
}

@injectable()
export class App extends ModuleApp<Apps> implements IApp {
  constructor(@inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter) {
    super(exceptionFilter, () => new Apps());
  }

  configureRouting(
    modules: Record<string, Pick<IDefaultApp, "describeRoutes">>,
  ) {
    this.apps.configureRouting(
      Object.entries(modules).flatMap(([name, module]) =>
        module.describeRoutes().map(({ route, resource }) => ({
          name: name + "." + route.slice(1),
          route: "/api/" + name + route,
          resource,
        })),
      ),
    );
  }
}
