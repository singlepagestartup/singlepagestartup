import { App, type IApp } from "./app";
import {
  createAppBootstrap,
  DI,
  ExceptionFilter,
  IExceptionFilter,
} from "@sps/shared-backend-api";
import { ContainerModule } from "inversify";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<IApp>(DI.IApp).to(App);
});

export const { bootstrap } = createAppBootstrap<IApp>(bindings);
