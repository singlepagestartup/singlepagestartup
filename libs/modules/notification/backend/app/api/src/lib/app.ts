import "reflect-metadata";
import { DI, ModuleApp, type IExceptionFilter } from "@sps/shared-backend-api";
import { inject, injectable } from "inversify";
import { Apps } from "./apps";

@injectable()
export class App extends ModuleApp<Apps> {
  constructor(@inject(DI.IExceptionFilter) exceptionFilter: IExceptionFilter) {
    super(exceptionFilter, () => new Apps());
  }
}
