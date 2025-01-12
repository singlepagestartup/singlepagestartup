import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Link } from "./link";
import { Component as Ghost } from "./ghost";
import { Component as Outline } from "./outline";
import { Component as Destructive } from "./destructive";
import { Component as Secondary } from "./secondary";
import { Component as Primary } from "./primary";
import { Component as Default } from "./default";

export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  link: Link,
  ghost: Ghost,
  outline: Outline,
  destructive: Destructive,
  secondary: Secondary,
  primary: Primary,
  default: Default,
};
