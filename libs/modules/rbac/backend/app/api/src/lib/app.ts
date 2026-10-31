import "reflect-metadata";
import {
  DI,
  ModuleApp,
  type IExceptionFilter,
  type IModuleApp,
} from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";

export interface IApp extends IModuleApp<Apps> {
  middleware: Apps["middleware"];
}

@injectable()
export class App extends ModuleApp<Apps> implements IApp {
  constructor(@inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter) {
    super(exceptionFilter, () => new Apps());
  }

  protected override configureApps(): void {
    this.apps.configure();
  }

  middleware() {
    return this.apps.middleware();
  }
}
