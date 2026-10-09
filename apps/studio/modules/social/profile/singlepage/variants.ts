import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AgentOverviewAiChat } from "./agent/overview/ai-chat/index";
import { Component as AgentAvatarAiChat } from "./agent/avatar/ai-chat/index";
import { Component as AgentSelectAiChat } from "./agent/select/ai-chat/index";
import { Component as ProjectCreateAiChat } from "./project/create/ai-chat/index";
import { Component as ProjectProcessingAiChat } from "./project/processing/ai-chat/index";
import { Component as ProjectScopeAiChat } from "./project/scope/ai-chat/index";
import { Component as ProjectSelectItemAiChat } from "./project/select/item/ai-chat/index";
import { Component as ProjectOverviewAiChat } from "./project/overview/ai-chat/index";
import { Component as ProjectSelectAiChat } from "./project/select/ai-chat/index";
import { Component as ProjectSettingsAiChat } from "./project/settings/ai-chat/index";
import { Component as ProjectSidebarAiChat } from "./project/sidebar/ai-chat/index";
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
  "project-create-ai-chat": ProjectCreateAiChat,
  "project-processing-ai-chat": ProjectProcessingAiChat,
  "project-scope-ai-chat": ProjectScopeAiChat,
  "project-select-item-ai-chat": ProjectSelectItemAiChat,
  "project-overview-ai-chat": ProjectOverviewAiChat,
  "project-select-ai-chat": ProjectSelectAiChat,
  "project-settings-ai-chat": ProjectSettingsAiChat,
  "project-sidebar-ai-chat": ProjectSidebarAiChat,
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
