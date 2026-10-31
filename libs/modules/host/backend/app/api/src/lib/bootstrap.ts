import { App, type IApp } from "./app";
import { DI, ExceptionFilter, IExceptionFilter } from "@sps/shared-backend-api";
import { Container, ContainerModule, interfaces } from "inversify";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<IApp>(DI.IApp).to(App);
});

export async function bootstrap() {
  const container = new Container();
  container.load(bindings);

  const app = container.get<IApp>(DI.IApp);
  await app.init();

  return { app };
}
