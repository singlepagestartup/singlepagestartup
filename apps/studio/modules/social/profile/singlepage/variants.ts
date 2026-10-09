import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AiChatAgent } from "./ai-chat-agent/index";
import { Component as AiChatAgentAvatar } from "./ai-chat-agent-avatar/index";
import { Component as AiChatAgentSelect } from "./ai-chat-agent-select/index";
import { Component as AiChatCreate } from "./ai-chat-create/index";
import { Component as AiChatProcessing } from "./ai-chat-processing/index";
import { Component as AiChatProject } from "./ai-chat-project/index";
import { Component as AiChatProjectItem } from "./ai-chat-project-item/index";
import { Component as AiChatProjectOverview } from "./ai-chat-project-overview/index";
import { Component as AiChatProjectSelect } from "./ai-chat-project-select/index";
import { Component as AiChatSettings } from "./ai-chat-settings/index";
import { Component as AiChatSidebar } from "./ai-chat-sidebar/index";
import { Component as AiChatUserMenu } from "./account-menu/index";
import { Component as ArticleFindByIdCommentFormDefault } from "./article-find-by-id-comment-form-default/index";
import { Component as Author } from "./author/index";
import { Component as AuthorFindByIdOverviewDefault } from "./author-find-by-id-overview-default/index";
import { Component as Byline } from "./byline/index";
import { Component as Card } from "./card/index";
import { Component as Compact } from "./compact/index";
import { Component as FindRow } from "./find-row/index";
import { Component as List } from "./list/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "ai-chat-agent": AiChatAgent,
  "ai-chat-agent-avatar": AiChatAgentAvatar,
  "ai-chat-agent-select": AiChatAgentSelect,
  "ai-chat-create": AiChatCreate,
  "ai-chat-processing": AiChatProcessing,
  "ai-chat-project": AiChatProject,
  "ai-chat-project-item": AiChatProjectItem,
  "ai-chat-project-overview": AiChatProjectOverview,
  "ai-chat-project-select": AiChatProjectSelect,
  "ai-chat-settings": AiChatSettings,
  "ai-chat-sidebar": AiChatSidebar,
  "account-menu": AiChatUserMenu,
  "article-find-by-id-comment-form-default": ArticleFindByIdCommentFormDefault,
  author: Author,
  "author-find-by-id-overview-default": AuthorFindByIdOverviewDefault,
  byline: Byline,
  card: Card,
  compact: Compact,
  "find-row": FindRow,
  list: List,
};
