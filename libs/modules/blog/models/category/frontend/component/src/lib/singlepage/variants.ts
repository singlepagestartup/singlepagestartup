import { Component as CardDefault } from "./card-default";
import { Component as OverviewDefault } from "./overview-default";
import { Component as ButtonDefault } from "./button-default";
import { Component as Find } from "./find";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as Default } from "./default";
export const variants = {
  "card-default": CardDefault,
  "overview-default": OverviewDefault,
  "button-default": ButtonDefault,
  find: Find,
  "admin-form": AdminForm,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  default: Default,
};
