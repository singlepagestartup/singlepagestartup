import { Component as AccountMenuDefault } from "./account-menu-default/index";
import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Settings } from "./admin-v2-settings/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AiChatAccount } from "./ai-chat-account/index";
import { Component as AiChatSettings } from "./ai-chat-settings/index";
import { Component as List } from "./list/index";
import { Component as MeCrmFormDeafult } from "./me-crm-form-deafult/index";
import { Component as MeDelete } from "./me-delete/index";
import { Component as MeIdentityFindInformation } from "./me-identity-find-information/index";
import { Component as MeInformation } from "./me-information/index";
import { Component as MeProfileInformation } from "./me-profile-information/index";
import { Component as MeSocialModuleProfileFindInformation } from "./me-social-module-profile-find-information/index";

export const variants = {
  "account-menu-default": AccountMenuDefault,
  "admin-v2-card": AdminV2Card,
  "admin-v2-settings": AdminV2Settings,
  "admin-v2-table": AdminV2Table,
  "ai-chat-account": AiChatAccount,
  "ai-chat-settings": AiChatSettings,
  list: List,
  "me-crm-form-deafult": MeCrmFormDeafult,
  "me-delete": MeDelete,
  "me-identity-find-information": MeIdentityFindInformation,
  "me-information": MeInformation,
  "me-profile-information": MeProfileInformation,
  "me-social-module-profile-find-information":
    MeSocialModuleProfileFindInformation,
};
