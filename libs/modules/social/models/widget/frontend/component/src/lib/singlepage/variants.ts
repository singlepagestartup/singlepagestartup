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
  default: Default,
};
