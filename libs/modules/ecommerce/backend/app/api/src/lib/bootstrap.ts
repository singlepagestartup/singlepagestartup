import { App } from "./app";
import type { Apps } from "./apps";
import {
  createAppBootstrap,
  DI,
  ExceptionFilter,
  IModuleApp,
  IExceptionFilter,
} from "@sps/shared-backend-api";
import { ContainerModule } from "inversify";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<IModuleApp<Apps>>(DI.IApp).to(App);
});

export const { bootstrap } = createAppBootstrap<IModuleApp<Apps>>(bindings);
