import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin-table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin-table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin-select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin-form";
import { IComponentProps as IDefaultComponentProps } from "./default";
import { IComponentProps as IOrdersListDefaultComponentProps } from "./orders-list-default";
import { IComponentProps as IProductsListDefaultComponentProps } from "./products-list-default";
import { IComponentProps as IProductOverviewDefaultComponentProps } from "./product-overview-default";
import { IComponentProps as ICategoriesListDefaultComponentProps } from "./categories-list-default";
import { IComponentProps as IStoresListDefaultComponentProps } from "./stores-list-default";
import { IComponentProps as ICategoryOverviewDefaultComponentProps } from "./category-overview-default";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IOrdersListDefaultComponentProps
  | IProductsListDefaultComponentProps
  | IProductOverviewDefaultComponentProps
  | ICategoriesListDefaultComponentProps
  | ICategoryOverviewDefaultComponentProps
  | IStoresListDefaultComponentProps
  | never;
