import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminForm } from "./admin/form";
import { Component as Find } from "./find";
import { Component as Default } from "./default";
import { Component as Overview } from "./overview";

export const variants = {
  "admin-select-input": AdminSelectInput,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-form": AdminForm,
  find: Find,
  default: Default,
  overview: Overview,
};
