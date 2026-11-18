import { App } from "./app";
import {
  createAppBootstrap,
  DI,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { ContainerModule } from "inversify";

export type IBootstrapResult = Awaited<ReturnType<typeof bootstrap>>;

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
});

export const { bootstrap } = createAppBootstrap<App>(bindings);
