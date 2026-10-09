import { Component as AiChatAgent } from "./ai-chat-agent/index";
import { Component as AiChatAgentAvatar } from "./ai-chat-agent-avatar/index";
import { Component as AiChatAgentSelect } from "./ai-chat-agent-select/index";
import { Component as AiChatCreate } from "./ai-chat-create/index";
import { Component as AiChatProject } from "./ai-chat-project/index";
import { Component as AiChatProjectItem } from "./ai-chat-project-item/index";
import { Component as AiChatProjectOverview } from "./ai-chat-project-overview/index";
import { Component as AiChatProjectSelect } from "./ai-chat-project-select/index";
import { Component as AiChatSettings } from "./ai-chat-settings/index";
import { Component as AiChatSidebar } from "./ai-chat-sidebar/index";
import { Component as AiChatUserMenu } from "./ai-chat-user-menu/index";

export const variants = {
  "ai-chat-agent": AiChatAgent,
  "ai-chat-agent-avatar": AiChatAgentAvatar,
  "ai-chat-agent-select": AiChatAgentSelect,
  "ai-chat-create": AiChatCreate,
  "ai-chat-project": AiChatProject,
  "ai-chat-project-item": AiChatProjectItem,
  "ai-chat-project-overview": AiChatProjectOverview,
  "ai-chat-project-select": AiChatProjectSelect,
  "ai-chat-settings": AiChatSettings,
  "ai-chat-sidebar": AiChatSidebar,
  "ai-chat-user-menu": AiChatUserMenu,
};
