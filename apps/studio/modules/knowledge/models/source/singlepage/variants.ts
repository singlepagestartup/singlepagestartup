import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AiChatCard } from "./ai-chat-card/index";
import { Component as AiChatDocument } from "./ai-chat-document/index";
import { Component as AiChatDocumentLink } from "./ai-chat-document-link/index";
import { Component as Find } from "./find/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "ai-chat-card": AiChatCard,
  "ai-chat-document": AiChatDocument,
  "ai-chat-document-link": AiChatDocumentLink,
  find: Find,
};
