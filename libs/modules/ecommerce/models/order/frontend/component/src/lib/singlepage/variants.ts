import { Component as IdTotalDefault } from "./id/total-default";
import { Component as OrdersToProductsQuantityDefault } from "./orders-to-products/quantity/default";
import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as Create } from "./create";
import { Component as Delete } from "./delete";

export const variants = {
  "id-total-default": IdTotalDefault,
  "orders-to-products-quantity-default": OrdersToProductsQuantityDefault,
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  create: Create,
  delete: Delete,
};
