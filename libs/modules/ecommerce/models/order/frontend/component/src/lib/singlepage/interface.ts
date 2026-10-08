import { IComponentProps as IOrdersToProductsQuantityDefaultComponentProps } from "./orders-to-products/quantity/default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2Card } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2SidebarItem } from "./admin-v2/sidebar-item/interface";
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
  | IAdminV2TableRowComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2Card
  | IAdminV2SidebarItem
  | IDefaultComponentProps
  | ICreateComponentProps
  | IDeleteComponentProps
  | ICartDefaultComponentProps
  | IFormFieldDefaultComponentProps
  | never;
