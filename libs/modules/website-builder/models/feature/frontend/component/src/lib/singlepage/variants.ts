import { Component as Find } from "./find";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as Default } from "./default";

export const variants = {
  "admin-form": AdminForm,
  "admin-select-input": AdminSelectInput,
  "admin-table": AdminTable,
  "admin-table-row": AdminTableRow,
  default: Default,
  find: Find,
};
