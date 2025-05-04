import { IComponentProps as ICategoryOverviewDefaultComponentProps } from "./category/overview/default/interface";
import { IComponentProps as ICategoryListButtonDefaultComponentProps } from "./category/list/button-default/interface";
import { IComponentProps as ICategoryListCardDefaultComponentProps } from "./category/list/card-default/interface";
import { IComponentProps as IArticleOverviewEcommerceModuleProductListCardDefaultComponentProps } from "./article/overview/ecommerce-module/product/list/card-default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IArticleListCardDefaultComponentProps } from "./article/list/card-default/interface";
import { IComponentProps as IArticleOverviewDefaultComponentProps } from "./article/overview/default/interface";
import { IComponentProps as IArticleOverviewWithPrivateContentDefaultComponentProps } from "./article/overview/with-private-content-default/interface";

export type IComponentProps =
  | ICategoryOverviewDefaultComponentProps
  | ICategoryListButtonDefaultComponentProps
  | ICategoryListCardDefaultComponentProps
  | IArticleOverviewEcommerceModuleProductListCardDefaultComponentProps
  | IFindComponentProps
  | IAdminFormComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IDefaultComponentProps
  | IArticleListCardDefaultComponentProps
  | IArticleOverviewDefaultComponentProps
  | IArticleOverviewWithPrivateContentDefaultComponentProps
  | never;
