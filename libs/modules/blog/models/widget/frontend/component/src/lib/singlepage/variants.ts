import { Component as Find } from "./find";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as Default } from "./default";
import { Component as ArticleListDefault } from "./article-list-default";
import { Component as ArticleOverviewDefault } from "./article-overview-default";
import { Component as ArticleOverviewWithPrivateContentDefault } from "./article-overview-with-private-content-default";

export const variants = {
  find: Find,
  "admin-form": AdminForm,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  default: Default,
  "article-list-default": ArticleListDefault,
  "article-overview-default": ArticleOverviewDefault,
  "article-overview-with-private-content-default":
    ArticleOverviewWithPrivateContentDefault,
};
