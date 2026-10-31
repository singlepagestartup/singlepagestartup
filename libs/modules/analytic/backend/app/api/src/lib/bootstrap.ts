import { App } from "./app";
import type { Apps } from "./apps";
import {
  DI,
  ExceptionFilter,
  IModuleApp,
  IExceptionFilter,
} from "@sps/shared-backend-api";
import { Container, ContainerModule, interfaces } from "inversify";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<IModuleApp<Apps>>(DI.IApp).to(App);
});

export async function bootstrap() {
  const container = new Container();
  container.load(bindings);

  const app = container.get<IModuleApp<Apps>>(DI.IApp);
  await app.init();

  return { app };
}
