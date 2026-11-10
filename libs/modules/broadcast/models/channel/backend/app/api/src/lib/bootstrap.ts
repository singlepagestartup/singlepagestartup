import { DeliveryRepository } from "./repository/delivery";
import { Container, ContainerModule, interfaces } from "inversify";
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
import { ChannelDI } from "./di";
import { Service as MessageService } from "@sps/broadcast/models/message/backend/app/api/src/lib/service";
import { app as messageApp } from "@sps/broadcast/models/message/backend/app/api";
import { Configuration as MessageConfiguration } from "@sps/broadcast/models/message/backend/app/api/src/lib/configuration";
import { Service as ChannelsToMessagesService } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/service";
import { app as channelsToMessagesApp } from "@sps/broadcast/relations/channels-to-messages/backend/app/api";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<DeliveryRepository>(ChannelDI.IDeliveryRepository)
    .toDynamicValue(() => new DeliveryRepository(new MessageConfiguration()))
    .inSingletonScope();
  bind<MessageService>(ChannelDI.IMessageService)
    .toDynamicValue(() => messageApp.controller.service as MessageService)
    .inSingletonScope();
  bind<ChannelsToMessagesService>(ChannelDI.IChannelsToMessagesService)
    .toDynamicValue(
      () =>
        channelsToMessagesApp.controller.service as ChannelsToMessagesService,
    )
    .inSingletonScope();
});

export async function bootstrap() {
  const container = new Container({
    skipBaseClassChecks: true,
  });
  container.load(bindings);
  const app = container.get<App>(DI.IApp);

  await app.init();

  return { app };
}
