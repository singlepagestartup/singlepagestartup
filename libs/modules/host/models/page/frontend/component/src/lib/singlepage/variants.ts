import { Component as UrlSegmentValue } from "./url-segment-value";
import { Component as FindByUrl } from "./find-by-url";
import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
export const variants = {
  "url-segment-value": UrlSegmentValue,
  "find-by-url": FindByUrl,
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
};
