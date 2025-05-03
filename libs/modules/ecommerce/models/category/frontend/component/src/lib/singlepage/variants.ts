import { Component as ButtonDefault } from "./button-default";
import { Component as Find } from "./find";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as Default } from "./default";
import { Component as OverviewDefault } from "./overview-default";

export const variants = {
  "button-default": ButtonDefault,
  find: Find,
  "admin-form": AdminForm,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  default: Default,
  "overview-default": OverviewDefault,
};
