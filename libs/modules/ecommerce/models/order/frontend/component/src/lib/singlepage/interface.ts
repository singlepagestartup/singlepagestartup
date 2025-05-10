import { IComponentProps as IIdTotalDefaultComponentProps } from "./id/total-default/interface";
import { IComponentProps as IOrdersToProductsQuantityDefaultComponentProps } from "./orders-to-products/quantity/default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as ICreateComponentProps } from "./create/interface";
import { IComponentProps as IDeleteComponentProps } from "./delete/interface";

export type IComponentProps =
  | IIdTotalDefaultComponentProps
  | IOrdersToProductsQuantityDefaultComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | ICreateComponentProps
  | IDeleteComponentProps
  | never;
