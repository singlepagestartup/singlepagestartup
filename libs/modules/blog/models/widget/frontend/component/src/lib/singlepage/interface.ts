import { IComponentProps as ICategoryOverviewDefaultComponentProps } from "./category/overview/default/interface";
import { IComponentProps as ICategoryListDefaultComponentProps } from "./category/list/default/interface";
import { IComponentProps as IArticleOverviewEcommerceModuleProductListCardDefaultComponentProps } from "./article/overview/ecommerce-module/product/list/default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2SidebarItemComponentProps } from "./admin-v2/sidebar-item/interface";
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
  | IAdminV2TableRowComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2CardComponentProps
  | IAdminV2SidebarItemComponentProps
  | IDefaultComponentProps
  | IArticleListDefaultComponentProps
  | IArticleOverviewDefaultComponentProps
  | IArticleOverviewWithPrivateContentDefaultComponentProps
  | never;
