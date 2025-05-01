import { App } from "./app";
import {
  DI,
  ExceptionFilter,
  IDefaultApp,
  IExceptionFilter,
} from "@sps/shared-backend-api";
import { Container, ContainerModule, interfaces } from "inversify";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<IDefaultApp>(DI.IApp).to(App);
});

export async function bootstrap() {
  const container = new Container();
  container.load(bindings);

  const app = container.get<IDefaultApp>(DI.IApp);
  await app.init();

  return { app };
}
