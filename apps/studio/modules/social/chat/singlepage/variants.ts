import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as ListItemAiChat } from "./list/item/ai-chat/index";
import { Component as OverviewPreviewAiChat } from "./overview/preview/ai-chat/index";
import { Component as OverviewAiChat } from "./overview/ai-chat/index";
import { Component as List } from "./list/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "list-item-ai-chat": ListItemAiChat,
  "overview-preview-ai-chat": OverviewPreviewAiChat,
  "overview-ai-chat": OverviewAiChat,
  list: List,
};
