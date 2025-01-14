import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IArticlesListDefaultComponentProps } from "./articles-list-default/interface";
import { IComponentProps as IArticleOverviewDefaultComponentProps } from "./article-overview-default/interface";
import { IComponentProps as IArticleOverviewWithPrivateContentDefaultComponentProps } from "./article-overview-with-private-content-default/interface";

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
