import { Component as ButtonDefault } from "./button-default";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as Default } from "./default";
import { Component as Find } from "./find";
export const variants = {
  "button-default": ButtonDefault,
  "admin-select-input": AdminSelectInput,
  "admin-table": AdminTable,
  "admin-form": AdminForm,
  "admin-table-row": AdminTableRow,
  default: Default,
  find: Find,
};
