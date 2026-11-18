import "reflect-metadata";
import {
  DI,
  ModuleApp,
  type IAppAssembly,
  type IExceptionFilter,
  type IModuleApp,
} from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";

export interface IApp extends IModuleApp<Apps> {
  resolveSubjectId(token: string): Promise<string>;
}

@injectable()
export class App extends ModuleApp<Apps> implements IApp {
  constructor(
    @inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter,
    @inject(DI.IAppAssembly) assembly: IAppAssembly,
  ) {
    super(exceptionFilter, () => new Apps(assembly));
  }

  async resolveSubjectId(token: string): Promise<string> {
    return this.apps.resolveSubjectId(token);
  }
}
