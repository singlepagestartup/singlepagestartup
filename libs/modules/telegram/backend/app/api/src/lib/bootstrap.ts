import { App } from "./app";
import { DI, ExceptionFilter, IExceptionFilter } from "@sps/shared-backend-api";
import { Container, ContainerModule, interfaces } from "inversify";
import { Controller } from "./controller";
import { Service } from "./service";
import { Bot } from "./bot";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<Bot>(DI.ITelegramBot).to(Bot);
  bind<Service>(DI.IService).to(Service);
  bind<Controller>(DI.IController).to(Controller);
  bind<App>(DI.IApp).to(App);
});

export async function bootstrap() {
  const container = new Container({ skipBaseClassChecks: true });
  container.load(bindings);

  const app = container.get<App>(DI.IApp);
  await app.init();

  return { app };
}
