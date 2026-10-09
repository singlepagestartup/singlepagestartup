import { Component as AiChatAsset } from "./ai-chat-asset/index";
import { Component as AiChatAttachments } from "./ai-chat-attachments/index";
import { Component as AiChatPending } from "./ai-chat-pending/index";
import { Component as AiChatPreview } from "./ai-chat-preview/index";

export const variants = {
  "ai-chat-asset": AiChatAsset,
  "ai-chat-attachments": AiChatAttachments,
  "ai-chat-pending": AiChatPending,
  "ai-chat-preview": AiChatPreview,
};
