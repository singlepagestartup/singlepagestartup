import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IOrderListDefaultComponentProps } from "./order/list-default/interface";
import { IComponentProps as IProductListDefaultComponentProps } from "./product/list-default/interface";
import { IComponentProps as IProductOverviewDefaultComponentProps } from "./product/overview-default/interface";
import { IComponentProps as ICategoryListDefaultComponentProps } from "./category/list-default/interface";
import { IComponentProps as IStoreListDefaultComponentProps } from "./store/list-default/interface";
import { IComponentProps as ICategoryOverviewDefaultComponentProps } from "./category/overview-default/interface";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IOrderListDefaultComponentProps
  | IProductListDefaultComponentProps
  | IProductOverviewDefaultComponentProps
  | ICategoryListDefaultComponentProps
  | ICategoryOverviewDefaultComponentProps
  | IStoreListDefaultComponentProps
  | never;
