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
import {
  AgentDI,
  type ITelegramConversationRuntime,
  type ITelegramConversationStore,
} from "./di";
import { Service as TelegramConversationMemoryStore } from "./service/startup/telegram-conversation-store";
import { Service as TelegramConversationRuntime } from "./service/startup/telegram-conversation";

const bindings = new ContainerModule(({ bind }) => {
  bind<ITelegramConversationStore>(AgentDI.ITelegramConversationStore)
    .toDynamicValue(() => new TelegramConversationMemoryStore())
    .inSingletonScope();
  bind<ITelegramConversationRuntime>(AgentDI.ITelegramConversationRuntime)
    .toDynamicValue((context) => {
      return new TelegramConversationRuntime(
        context.get<ITelegramConversationStore>(
          AgentDI.ITelegramConversationStore,
        ),
      );
    })
    .inSingletonScope();
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller).inSingletonScope();
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service).inSingletonScope();
  bind<Configuration>(DI.IConfiguration).to(Configuration);
});

export const agentBootstrap = createAppBootstrap<App, Service>(bindings);
export const { bootstrap, createService } = agentBootstrap;
export { agentBootstrap as serviceBootstrap };
