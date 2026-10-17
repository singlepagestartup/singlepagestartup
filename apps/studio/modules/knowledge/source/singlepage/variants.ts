import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as DownloadAiChat } from "./download/ai-chat/index";
import { Component as IdSidebarAiChat } from "./id-sidebar-ai-chat/index";
import { Component as IdAiChat } from "./id/ai-chat/index";
import { Component as List } from "./list/index";
import { Component as ListItemDocumentAiChat } from "./list-item-document-ai-chat/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "download-ai-chat": DownloadAiChat,
  "id-sidebar-ai-chat": IdSidebarAiChat,
  "id-ai-chat": IdAiChat,
  list: List,
  "list-item-document-ai-chat": ListItemDocumentAiChat,
};
