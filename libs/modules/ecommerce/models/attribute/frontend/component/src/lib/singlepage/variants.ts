import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminV2TableRow } from "./admin-v2/table-row";
import { Component as AdminV2Table } from "./admin-v2/table";
import { Component as AdminV2SelectInput } from "./admin-v2/select-input";
import { Component as AdminV2Form } from "./admin-v2/form";
import { Component as Default } from "./default";
export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  "admin-v2-table-row": AdminV2TableRow,
  "admin-v2-table": AdminV2Table,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-form": AdminV2Form,
  default: Default,
};
