import { Component as CartDefault } from "./cart/default";
import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as OverviewDefault } from "./overview-default";
import { Component as PriceDefault } from "./price-default";
import { Component as CurrencyToggleGroupDefault } from "./currency/toggle-group-default";

export const variants = {
  "cart-default": CartDefault,
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  "overview-default": OverviewDefault,
  "price-default": PriceDefault,
  "currency-toggle-group-default": CurrencyToggleGroupDefault,
};
