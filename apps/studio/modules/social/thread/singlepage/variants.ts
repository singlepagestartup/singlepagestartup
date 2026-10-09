import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AiChatComposer } from "./ai-chat-composer/index";
import { Component as AiChatConversation } from "./ai-chat-conversation/index";
import { Component as AiChatCreate } from "./ai-chat-create/index";
import { Component as AiChatProducts } from "./ai-chat-products/index";
import { Component as AiChatSettings } from "./ai-chat-settings/index";
import { Component as AiChatSidebarItem } from "./ai-chat-sidebar-item/index";
import { Component as ChatSettings } from "./chat-settings/index";
import { Component as List } from "./list/index";
import { Component as ListDefault } from "./list-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "ai-chat-composer": AiChatComposer,
  "ai-chat-conversation": AiChatConversation,
  "ai-chat-create": AiChatCreate,
  "ai-chat-products": AiChatProducts,
  "ai-chat-settings": AiChatSettings,
  "ai-chat-sidebar-item": AiChatSidebarItem,
  "chat-settings": ChatSettings,
  list: List,
  "list-default": ListDefault,
};
