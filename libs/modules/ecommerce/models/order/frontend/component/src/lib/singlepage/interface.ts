import { IComponentProps as IOrdersToProductsQuantityDefaultComponentProps } from "./orders-to-products/quantity/default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as ICreateComponentProps } from "./create/interface";
import { IComponentProps as IDeleteComponentProps } from "./delete/interface";
import { IComponentProps as ICartDefaultComponentProps } from "./cart-default/interface";
import { IComponentProps as IFormFieldDefaultComponentProps } from "./form-field-default/interface";
export type IComponentProps =
  | IOrdersToProductsQuantityDefaultComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | ICreateComponentProps
  | IDeleteComponentProps
  | ICartDefaultComponentProps
  | IFormFieldDefaultComponentProps
  | never;
