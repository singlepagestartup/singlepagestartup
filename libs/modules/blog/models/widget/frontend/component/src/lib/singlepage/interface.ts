import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminFormComponentProps } from "./admin-form";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin-table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin-table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin-select-input";
import { IComponentProps as IDefaultComponentProps } from "./default";
import { IComponentProps as IArticlesListDefaultComponentProps } from "./articles-list-default";
import { IComponentProps as IArticleOverviewDefaultComponentProps } from "./article-overview-default";
import { IComponentProps as IArticleOverviewWithPrivateContentDefaultComponentProps } from "./article-overview-with-private-content-default";

export type IComponentProps =
  | IFindComponentProps
  | IAdminFormComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IDefaultComponentProps
  | IArticlesListDefaultComponentProps
  | IArticleOverviewDefaultComponentProps
  | IArticleOverviewWithPrivateContentDefaultComponentProps
  | never;
