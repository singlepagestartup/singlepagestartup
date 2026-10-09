import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AiChatAsset } from "./ai-chat-asset/index";
import { Component as AiChatAttachments } from "./ai-chat-attachments/index";
import { Component as AiChatPending } from "./ai-chat-pending/index";
import { Component as AiChatPreview } from "./ai-chat-preview/index";
import { Component as List } from "./list/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "ai-chat-asset": AiChatAsset,
  "ai-chat-attachments": AiChatAttachments,
  "ai-chat-pending": AiChatPending,
  "ai-chat-preview": AiChatPreview,
  list: List,
};
