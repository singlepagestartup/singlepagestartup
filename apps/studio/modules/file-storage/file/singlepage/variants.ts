import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AttachmentAiChat } from "./attachment-ai-chat/index";
import { Component as IdAiChat } from "./id/ai-chat/index";
import { Component as List } from "./list/index";
import { Component as ListAttachmentsAiChat } from "./list-attachments-ai-chat/index";
import { Component as ListItemAssetAiChat } from "./list-item-asset-ai-chat/index";
import { Component as ListItemPendingAiChat } from "./list-item-pending-ai-chat/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "attachment-ai-chat": AttachmentAiChat,
  "id-ai-chat": IdAiChat,
  list: List,
  "list-attachments-ai-chat": ListAttachmentsAiChat,
  "list-item-asset-ai-chat": ListItemAssetAiChat,
  "list-item-pending-ai-chat": ListItemPendingAiChat,
};
