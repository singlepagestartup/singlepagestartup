import { Component as AiChatComposer } from "./ai-chat-composer/index";
import { Component as AiChatConversation } from "./ai-chat-conversation/index";
import { Component as AiChatCreate } from "./ai-chat-create/index";
import { Component as AiChatProducts } from "./ai-chat-products/index";
import { Component as AiChatSettings } from "./ai-chat-settings/index";
import { Component as AiChatSidebarItem } from "./ai-chat-sidebar-item/index";

export const variants = {
  "ai-chat-composer": AiChatComposer,
  "ai-chat-conversation": AiChatConversation,
  "ai-chat-create": AiChatCreate,
  "ai-chat-products": AiChatProducts,
  "ai-chat-settings": AiChatSettings,
  "ai-chat-sidebar-item": AiChatSidebarItem,
};
