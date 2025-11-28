import { Component as find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as ToggleGroupDefault } from "./toggle-group-default";
import { Component as Symbol } from "./symbol";

export const variants = {
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  find: find,
  "toggle-group-default": ToggleGroupDefault,
  symbol: Symbol,
};
