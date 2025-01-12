import { Component as Find } from "./find";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminTable } from "./admin/table";
import { Component as Default } from "./default";
import { Component as ContentDefaultComponent } from "./content-default";
import { Component as FooterDefaultComponent } from "./footer-default";
import { Component as NavbarDefaultComponent } from "./navbar-default";
export const variants = {
  find: Find,
  "admin-select-input": AdminSelectInput,
  "admin-table-row": AdminTableRow,
  "admin-form": AdminForm,
  "admin-table": AdminTable,
  default: Default,
  "content-default": ContentDefaultComponent,
  "footer-default": FooterDefaultComponent,
  "navbar-default": NavbarDefaultComponent,
};
