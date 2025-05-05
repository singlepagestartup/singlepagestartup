import { Component as CategoryOverviewDefault } from "./category/overview/default";
import { Component as CategoryListCardDefault } from "./category/list/card-default";
import { Component as ArticleOverviewEcommerceModuleProductListCardDefault } from "./article/overview/ecommerce-module/product/list/card-default";
import { Component as Find } from "./find";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as Default } from "./default";
import { Component as ArticleListCardDefault } from "./article/list/card-default";
import { Component as ArticleOverviewDefault } from "./article/overview/default";
import { Component as ArticleOverviewWithPrivateContentDefault } from "./article/overview/with-private-content-default";

export const variants = {
  "category-overview-default": CategoryOverviewDefault,
  "category-list-card-default": CategoryListCardDefault,
  "article-overview-ecommerce-module-product-list-card-default":
    ArticleOverviewEcommerceModuleProductListCardDefault,
  find: Find,
  "admin-form": AdminForm,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  default: Default,
  "article-list-card-default": ArticleListCardDefault,
  "article-overview-default": ArticleOverviewDefault,
  "article-overview-with-private-content-default":
    ArticleOverviewWithPrivateContentDefault,
};
