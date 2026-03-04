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
import { Service as MessageService } from "@sps/broadcast/models/message/backend/app/api/src/lib/service/singlepage";
import { Repository as MessageRepository } from "@sps/broadcast/models/message/backend/app/api/src/lib/repository";
import { Configuration as MessageConfiguration } from "@sps/broadcast/models/message/backend/app/api/src/lib/configuration";
import { Service as ChannelsToMessagesService } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/service/singlepage";
import { Repository as ChannelsToMessagesRepository } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/repository";
import { Configuration as ChannelsToMessagesConfiguration } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<MessageService>(ChannelDI.IMessageService)
    .toDynamicValue(
      () =>
        new MessageService(new MessageRepository(new MessageConfiguration())),
    )
    .inSingletonScope();
  bind<ChannelsToMessagesService>(ChannelDI.IChannelsToMessagesService)
    .toDynamicValue(
      () =>
        new ChannelsToMessagesService(
          new ChannelsToMessagesRepository(
            new ChannelsToMessagesConfiguration(),
          ),
        ),
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
