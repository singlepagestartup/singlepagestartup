import { Container, ContainerModule } from "inversify";
import {
  DI,
  DatabaseRepository,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { MessageDI } from "./di";
import { Table } from "@sps/broadcast/models/message/backend/repository/database";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<DatabaseRepository<typeof Table>>(MessageDI.IPayloadRepository)
    .toDynamicValue((context) => {
      const configuration = context.get<Configuration>(DI.IConfiguration);
      return new DatabaseRepository(configuration);
    })
    .inSingletonScope();
});

export async function bootstrap() {
  const container = new Container();
  container.load(bindings);
  const app = container.get<App>(DI.IApp);

  await app.init();

  return { app };
}
