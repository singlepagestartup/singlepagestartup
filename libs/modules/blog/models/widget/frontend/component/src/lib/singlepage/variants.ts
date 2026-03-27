import { Component as CategoryOverviewDefault } from "./category/overview/default";
import { Component as CategoryListDefault } from "./category/list/default";
import { Component as ArticleOverviewEcommerceModuleProductListDefault } from "./article/overview/ecommerce-module/product/list/default";
import { Component as Find } from "./find";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminV2TableRow } from "./admin-v2/table-row";
import { Component as AdminV2Table } from "./admin-v2/table";
import { Component as AdminV2SelectInput } from "./admin-v2/select-input";
import { Component as AdminV2Form } from "./admin-v2/form";
import { Component as AdminV2Card } from "./admin-v2/card";
import { Component as AdminV2SidebarItem } from "./admin-v2/sidebar-item";
import { Component as Default } from "./default";
import { Component as ArticleListDefault } from "./article/list/default";
import { Component as ArticleOverviewDefault } from "./article/overview/default";
import { Component as ArticleOverviewWithPrivateContentDefault } from "./article/overview/with-private-content-default";

export const variants = {
  "category-overview-default": CategoryOverviewDefault,
  "category-list-default": CategoryListDefault,
  "article-overview-ecommerce-module-product-list-default":
    ArticleOverviewEcommerceModuleProductListDefault,
  find: Find,
  "admin-form": AdminForm,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-v2-table-row": AdminV2TableRow,
  "admin-v2-table": AdminV2Table,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-form": AdminV2Form,
  "admin-v2-card": AdminV2Card,
  "admin-v2-sidebar-item": AdminV2SidebarItem,
  default: Default,
  "article-list-default": ArticleListDefault,
  "article-overview-default": ArticleOverviewDefault,
  "article-overview-with-private-content-default":
    ArticleOverviewWithPrivateContentDefault,
};
