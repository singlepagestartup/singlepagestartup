import { DeliveryRepository } from "./repository/delivery";
import { ContainerModule } from "inversify";
import {
  createAppBootstrap,
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
import { createService as createMessageService } from "@sps/broadcast/models/message/backend/app/api/src/lib/bootstrap";
import { Configuration as MessageConfiguration } from "@sps/broadcast/models/message/backend/app/api/src/lib/configuration";
import { Service as ChannelsToMessagesService } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/service";
import { createService as createChannelsToMessagesService } from "@sps/broadcast/relations/channels-to-messages/backend/app/api/src/lib/bootstrap";

const bindings = new ContainerModule(({ bind }) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<DeliveryRepository>(ChannelDI.IDeliveryRepository)
    .toDynamicValue(() => new DeliveryRepository(new MessageConfiguration()))
    .inSingletonScope();
  bind<MessageService>(ChannelDI.IMessageService)
    .toDynamicValue(() => createMessageService())
    .inSingletonScope();
  bind<ChannelsToMessagesService>(ChannelDI.IChannelsToMessagesService)
    .toDynamicValue(() => createChannelsToMessagesService())
    .inSingletonScope();
});

export const { bootstrap, createService } = createAppBootstrap<App, Service>(
  bindings,
);
