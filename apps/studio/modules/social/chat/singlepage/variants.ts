import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as IdAiChat } from "./id/ai-chat/index";
import { Component as IdPreviewAiChat } from "./id/preview/ai-chat/index";
import { Component as List } from "./list/index";
import { Component as ListItemAiChat } from "./list-item-ai-chat/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "id-ai-chat": IdAiChat,
  "id-preview-ai-chat": IdPreviewAiChat,
  list: List,
  "list-item-ai-chat": ListItemAiChat,
};
