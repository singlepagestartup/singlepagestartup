import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin-table-row";
import { Component as AdminTable } from "./admin-table";
import { Component as AdminSelectInput } from "./admin-select-input";
import { Component as AdminForm } from "./admin-form";
import { Component as Default } from "./default";
import { Component as OverviewDefault } from "./overview-default";
import { Component as CardDefault } from "./card-default";
import { Component as PriceDefault } from "./price-default";

export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  "overview-default": OverviewDefault,
  "card-default": CardDefault,
  "price-default": PriceDefault,
};
