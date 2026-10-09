import { Component as AiChat } from "./ai-chat/index";
import { Component as AiChatHelp } from "./ai-chat-help/index";
import { Component as AiChatLogin } from "./ai-chat-login/index";
import { Component as AiChatProjectsNew } from "./ai-chat-projects-new/index";
import { Component as AiChatProjectsProjectId } from "./ai-chat-projects-project-id/index";
import { Component as AiChatProjectsProjectIdSettings } from "./ai-chat-projects-project-id-settings/index";
import { Component as AiChatProjectsProjectIdThreadsNew } from "./ai-chat-projects-project-id-threads-new/index";
import { Component as AiChatRegister } from "./ai-chat-register/index";
import { Component as AiChatSettings } from "./ai-chat-settings/index";
import { Component as AiChatTokens } from "./ai-chat-tokens/index";

export const variants = {
  "ai-chat": AiChat,
  "ai-chat-help": AiChatHelp,
  "ai-chat-login": AiChatLogin,
  "ai-chat-projects-new": AiChatProjectsNew,
  "ai-chat-projects-project-id": AiChatProjectsProjectId,
  "ai-chat-projects-project-id-settings": AiChatProjectsProjectIdSettings,
  "ai-chat-projects-project-id-threads-new": AiChatProjectsProjectIdThreadsNew,
  "ai-chat-register": AiChatRegister,
  "ai-chat-settings": AiChatSettings,
  "ai-chat-tokens": AiChatTokens,
};
