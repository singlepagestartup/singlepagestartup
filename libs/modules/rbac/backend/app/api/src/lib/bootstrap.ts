import { App, type IApp } from "./app";
import { Apps } from "./apps";
import {
  createAppBootstrap,
  createModuleBootstrap,
  DI,
  ExceptionFilter,
  IExceptionFilter,
} from "@sps/shared-backend-api";
import { ContainerModule } from "inversify";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<IApp>(DI.IApp).to(App);
});

export const moduleBootstrap = createModuleBootstrap(
  createAppBootstrap<IApp>(bindings),
  (assembly) => new Apps(assembly),
);
export const { bootstrap } = moduleBootstrap;
