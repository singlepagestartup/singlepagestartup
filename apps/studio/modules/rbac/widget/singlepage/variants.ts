import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as List } from "./list/index";
import { Component as SubjectMeProfileSettings } from "./subject-me-profile-settings/index";
import { Component as SubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat } from "./subject-me-social-module-profile-id-chat-id-thread-create-ai-chat/index";
import { Component as SubjectMeSocialModuleProfileIdChatIdThreadIdAiChat } from "./subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/index";
import { Component as SubjectMeSocialModuleProfileIdSettingsAiChat } from "./subject-me-social-module-profile-id-settings-ai-chat/index";
import { Component as SubjectMeSocialModuleProfileListAiChat } from "./subject-me-social-module-profile-list-ai-chat/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  list: List,
  "subject-me-profile-settings": SubjectMeProfileSettings,
  "subject-me-social-module-profile-id-chat-id-thread-create-ai-chat":
    SubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat,
  "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat":
    SubjectMeSocialModuleProfileIdChatIdThreadIdAiChat,
  "subject-me-social-module-profile-id-settings-ai-chat":
    SubjectMeSocialModuleProfileIdSettingsAiChat,
  "subject-me-social-module-profile-list-ai-chat":
    SubjectMeSocialModuleProfileListAiChat,
};
