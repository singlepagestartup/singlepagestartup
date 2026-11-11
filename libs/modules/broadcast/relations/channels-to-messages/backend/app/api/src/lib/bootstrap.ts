import { Container, ContainerModule } from "inversify";
import {
  DI,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { ChannelsToMessagesDI, type IMessageService } from "./di";
import { app as messageApp } from "@sps/broadcast/models/message/backend/app/api";
import type { Service as BroadcastModuleMessage } from "@sps/broadcast/models/message/backend/app/api/src/lib/service";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<IMessageService>(ChannelsToMessagesDI.IMessageService)
    .toDynamicValue(
      () => messageApp.controller.service as BroadcastModuleMessage,
    )
    .inSingletonScope();
});

export async function bootstrap() {
  const container = new Container();
  container.load(bindings);
  const app = container.get<App>(DI.IApp);

  await app.init();

  return { app };
}
