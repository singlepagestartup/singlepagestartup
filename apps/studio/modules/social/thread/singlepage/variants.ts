import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as CreateAiChat } from "./create/ai-chat/index";
import { Component as OverviewAiChat } from "./overview/ai-chat/index";
import { Component as SettingsAiChat } from "./settings/ai-chat/index";
import { Component as ListItemSidebarAiChat } from "./list/item/sidebar/ai-chat/index";
import { Component as ChatSettings } from "./chat-settings/index";
import { Component as List } from "./list/index";
import { Component as ListDefault } from "./list-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "create-ai-chat": CreateAiChat,
  "overview-ai-chat": OverviewAiChat,
  "settings-ai-chat": SettingsAiChat,
  "list-item-sidebar-ai-chat": ListItemSidebarAiChat,
  "chat-settings": ChatSettings,
  list: List,
  "list-default": ListDefault,
};
