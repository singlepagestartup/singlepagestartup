import { Component as AIChatPageHelp } from "./ai-chat-help";
import { Component as AIChatPageSettings } from "./ai-chat-settings";
import { Component as AIChatPageTokens } from "./ai-chat-tokens";
import { Component as AIChatPageProjectsProjectId } from "./ai-chat-projects-project-id";
import { Component as AIChatPageProjectsNew } from "./ai-chat-projects-new";
import { Component as AIChatPageLogin } from "./ai-chat-login";
import { Component as AIChatPageRegister } from "./ai-chat-register";
import { Component as AIChatPage } from "./ai-chat";
import { Component as AdminV2SidebarItem } from "./admin-v2/sidebar-item";
import { Component as AdminV2Card } from "./admin-v2/card";
import { Component as AdminV2Form } from "./admin-v2/form";
import { Component as AdminV2SelectInput } from "./admin-v2/select-input";
import { Component as AdminV2Table } from "./admin-v2/table";
import { Component as AdminV2TableRow } from "./admin-v2/table-row";
import { Component as UrlSegmentValue } from "./url-segment-value";
import { Component as FindByUrl } from "./find-by-url";
import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
export const variants = {
  "ai-chat-help": AIChatPageHelp,
  "ai-chat-settings": AIChatPageSettings,
  "ai-chat-tokens": AIChatPageTokens,
  "ai-chat-projects-project-id": AIChatPageProjectsProjectId,
  "ai-chat-projects-new": AIChatPageProjectsNew,
  "ai-chat-login": AIChatPageLogin,
  "ai-chat-register": AIChatPageRegister,
  "ai-chat": AIChatPage,
  "url-segment-value": UrlSegmentValue,
  "find-by-url": FindByUrl,
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  "admin-v2-table-row": AdminV2TableRow,
  "admin-v2-table": AdminV2Table,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-form": AdminV2Form,
  "admin-v2-card": AdminV2Card,
  "admin-v2-sidebar-item": AdminV2SidebarItem,
  default: Default,
};
