import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as Default } from "./default";
import { Component as OrderListDefault } from "./order/list-default";
import { Component as ProductListCardDefault } from "./product/list-card-default";
import { Component as ProductOverviewDefault } from "./product/overview-default";
import { Component as CategoryListDefault } from "./category/list-default";
import { Component as StoreListDefault } from "./store/list-default";
import { Component as CategoryOverviewDefault } from "./category/overview-default";
import { Component as StoreProductListCardDefault } from "./store/product/list-card-default";

export const variants = {
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  default: Default,
  "order-list-default": OrderListDefault,
  "product-list-card-default": ProductListCardDefault,
  "product-overview-default": ProductOverviewDefault,
  "category-list-default": CategoryListDefault,
  "category-overview-default": CategoryOverviewDefault,
  "store-list-default": StoreListDefault,
  "store-product-list-card-default": StoreProductListCardDefault,
};
