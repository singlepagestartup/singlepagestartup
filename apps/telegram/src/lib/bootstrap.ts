import { App } from "./app";
import { DI, ExceptionFilter, IExceptionFilter } from "@sps/shared-backend-api";
import { Container, ContainerModule } from "inversify";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
});

export async function bootstrap() {
  const container = new Container();
  container.load(bindings);

  const app = container.get<App>(DI.IApp);
  await app.init();

  return { app };
}
