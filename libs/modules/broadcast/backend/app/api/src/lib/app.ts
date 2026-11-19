import "reflect-metadata";
import {
  DI,
  ModuleApp,
  type IAppAssembly,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";

@injectable()
export class App extends ModuleApp<Apps> {
  constructor(
    @inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter,
    @inject(DI.IAppAssembly) assembly: IAppAssembly,
  ) {
    super(exceptionFilter, () => new Apps(assembly));
  }
}
