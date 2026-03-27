import { Component as Find } from "../../../../../../../permission/frontend/component/src/lib/singlepage/find";
import { Component as AdminTableRow } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin/table-row";
import { Component as AdminTable } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin/table";
import { Component as AdminSelectInput } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin/select-input";
import { Component as AdminForm } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin/form";
import { Component as AdminV2TableRow } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin-v2/table-row";
import { Component as AdminV2Table } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin-v2/table";
import { Component as AdminV2SelectInput } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin-v2/select-input";
import { Component as AdminV2Form } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin-v2/form";
import { Component as AdminV2Card } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin-v2/card";
import { Component as AdminV2SidebarItem } from "../../../../../../../permission/frontend/component/src/lib/singlepage/admin-v2/sidebar-item";
import { Component as Default } from "../../../../../../../permission/frontend/component/src/lib/singlepage/default";
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
  "admin-v2-card": AdminV2Card,
  "admin-v2-sidebar-item": AdminV2SidebarItem,
  default: Default,
};
