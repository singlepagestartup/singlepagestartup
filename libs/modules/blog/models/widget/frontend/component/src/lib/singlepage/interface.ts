import { IComponentProps as ICategoryOverviewDefaultComponentProps } from "./category/overview/default/interface";
import { IComponentProps as ICategoryListDefaultComponentProps } from "./category/list/default/interface";
import { IComponentProps as IArticleOverviewEcommerceModuleProductListCardDefaultComponentProps } from "./article/overview/ecommerce-module/product/list/default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IArticleListDefaultComponentProps } from "./article/list/default/interface";
import { IComponentProps as IArticleOverviewDefaultComponentProps } from "./article/overview/default/interface";
import { IComponentProps as IArticleOverviewWithPrivateContentDefaultComponentProps } from "./article/overview/with-private-content-default/interface";

export type IComponentProps =
  | ICategoryOverviewDefaultComponentProps
  | ICategoryListDefaultComponentProps
  | IArticleOverviewEcommerceModuleProductListCardDefaultComponentProps
  | IFindComponentProps
  | IAdminFormComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IDefaultComponentProps
  | IArticleListDefaultComponentProps
  | IArticleOverviewDefaultComponentProps
  | IArticleOverviewWithPrivateContentDefaultComponentProps
  | never;
