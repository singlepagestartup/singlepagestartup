import { App } from "./app";
import { Apps } from "./apps";
import {
  createAppBootstrap,
  createModuleBootstrap,
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

export const moduleBootstrap = createModuleBootstrap(
  createAppBootstrap<IModuleApp<Apps>>(bindings),
  (assembly) => new Apps(assembly),
);
export const { bootstrap } = moduleBootstrap;
