import { Component as Find } from "../../../../../../../action/frontend/component/src/lib/singlepage/find";
import { Component as AdminTableRow } from "../../../../../../../action/frontend/component/src/lib/singlepage/admin/table-row";
import { Component as AdminTable } from "../../../../../../../action/frontend/component/src/lib/singlepage/admin/table";
import { Component as AdminSelectInput } from "../../../../../../../action/frontend/component/src/lib/singlepage/admin/select-input";
import { Component as AdminForm } from "../../../../../../../action/frontend/component/src/lib/singlepage/admin/form";
import { Component as Default } from "../../../../../../../action/frontend/component/src/lib/singlepage/default";
export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
};
