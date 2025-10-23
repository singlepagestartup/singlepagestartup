import { Component as SelectOptionDefault } from "./select-option-default";
import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as TextDefault } from "./text-default";
import { Component as TextareaDefault } from "./textarea-default";

export const variants = {
  "select-option-default": SelectOptionDefault,
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  "text-default": TextDefault,
  "textarea-default": TextareaDefault,
};
