import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AgentOverviewAiChat } from "./agent/overview/ai-chat/index";
import { Component as AgentAvatarAiChat } from "./agent/avatar/ai-chat/index";
import { Component as AgentSelectAiChat } from "./agent/select/ai-chat/index";
import { Component as CreateAiChatProject } from "./create/ai-chat/project/index";
import { Component as ProcessingAiChatProject } from "./processing/ai-chat/project/index";
import { Component as ScopeAiChatProject } from "./scope/ai-chat/project/index";
import { Component as SelectItemAiChatProject } from "./select/item/ai-chat/project/index";
import { Component as OverviewDefault } from "./overview/default/index";
import { Component as OverviewAiChatProject } from "./overview/ai-chat/project/index";
import { Component as SelectAiChatProject } from "./select/ai-chat/project/index";
import { Component as SettingsAiChatProject } from "./settings/ai-chat/project/index";
import { Component as SidebarAiChatProject } from "./sidebar/ai-chat/project/index";
import { Component as AccountMenu } from "./account-menu/index";
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
  "agent-overview-ai-chat": AgentOverviewAiChat,
  "agent-avatar-ai-chat": AgentAvatarAiChat,
  "agent-select-ai-chat": AgentSelectAiChat,
  "create-ai-chat-project": CreateAiChatProject,
  "processing-ai-chat-project": ProcessingAiChatProject,
  "scope-ai-chat-project": ScopeAiChatProject,
  "select-item-ai-chat-project": SelectItemAiChatProject,
  "overview-default": OverviewDefault,
  "overview-ai-chat-project": OverviewAiChatProject,
  "select-ai-chat-project": SelectAiChatProject,
  "settings-ai-chat-project": SettingsAiChatProject,
  "sidebar-ai-chat-project": SidebarAiChatProject,
  "account-menu": AccountMenu,
  "article-find-by-id-comment-form-default": ArticleFindByIdCommentFormDefault,
  author: Author,
  "author-find-by-id-overview-default": AuthorFindByIdOverviewDefault,
  byline: Byline,
  card: Card,
  compact: Compact,
  "find-row": FindRow,
  list: List,
};
