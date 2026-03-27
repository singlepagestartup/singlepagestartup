import { Component as AdminV2SidebarItem } from "./admin-v2/sidebar-item";
import { Component as AdminV2Card } from "./admin-v2/card";
import { Component as AdminV2Form } from "./admin-v2/form";
import { Component as AdminV2SelectInput } from "./admin-v2/select-input";
import { Component as AdminV2Table } from "./admin-v2/table";
import { Component as AdminV2TableRow } from "./admin-v2/table-row";
import { Component as ProfileOverviewDefault } from "./profile/overview/default";
import { Component as ChatListDefault } from "./chat/list/default";
import { Component as ChatOverviewDefault } from "./chat/overview/default";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as Find } from "./find";
import { Component as Default } from "./default";
export const variants = {
  "profile-overview-default": ProfileOverviewDefault,
  "chat-list-default": ChatListDefault,
  "chat-overview-default": ChatOverviewDefault,
  "admin-select-input": AdminSelectInput,
  "admin-table": AdminTable,
  "admin-form": AdminForm,
  "admin-table-row": AdminTableRow,
  find: Find,
  "admin-v2-table-row": AdminV2TableRow,
  "admin-v2-table": AdminV2Table,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-form": AdminV2Form,
  "admin-v2-card": AdminV2Card,
  "admin-v2-sidebar-item": AdminV2SidebarItem,
  default: Default,
};
