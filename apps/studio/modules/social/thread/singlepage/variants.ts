import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as ChatSettings } from "./chat-settings/index";
import { Component as CreateAiChat } from "./create/ai-chat/index";
import { Component as DownloadAiChat } from "./download/ai-chat/index";
import { Component as IdAiChat } from "./id/ai-chat/index";
import { Component as IdAiChatSettings } from "./id/ai-chat-settings/index";
import { Component as List } from "./list/index";
import { Component as ListDefault } from "./list-default/index";
import { Component as ListItemSidebarAiChat } from "./list-item-sidebar-ai-chat/index";
import { Component as MessageListAiChat } from "./message/list/ai-chat/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "chat-settings": ChatSettings,
  "create-ai-chat": CreateAiChat,
  "download-ai-chat": DownloadAiChat,
  "id-ai-chat": IdAiChat,
  "id-ai-chat-settings": IdAiChatSettings,
  list: List,
  "list-default": ListDefault,
  "list-item-sidebar-ai-chat": ListItemSidebarAiChat,
  "message-list-ai-chat": MessageListAiChat,
};
