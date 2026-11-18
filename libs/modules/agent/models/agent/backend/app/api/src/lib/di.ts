export type {
  ITelegramConversationRuntime,
  ITelegramConversationStore,
} from "./service/singlepage/telegram-conversation";

export const AgentDI = {
  ITelegramConversationStore: Symbol.for("agent.telegram.conversation.store"),
  ITelegramConversationRuntime: Symbol.for(
    "agent.telegram.conversation.runtime",
  ),
};
