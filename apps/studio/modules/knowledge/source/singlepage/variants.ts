import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as OverviewAiChat } from "./overview/ai-chat/index";
import { Component as OverviewDocumentAiChat } from "./overview/document/ai-chat/index";
import { Component as ListItemDocumentAiChat } from "./list/item/document/ai-chat/index";
import { Component as DownloadAiChat } from "./download/ai-chat/index";
import { Component as List } from "./list/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "overview-ai-chat": OverviewAiChat,
  "overview-document-ai-chat": OverviewDocumentAiChat,
  "list-item-document-ai-chat": ListItemDocumentAiChat,
  "download-ai-chat": DownloadAiChat,
  list: List,
};
