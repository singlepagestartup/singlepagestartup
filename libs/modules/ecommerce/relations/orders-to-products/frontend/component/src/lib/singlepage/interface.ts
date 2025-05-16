import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IFormFieldComponentProps } from "./form-field-default/interface";
import { IComponentProps as IAmountComponentProps } from "./amount/interface";
import { IComponentProps as IIdTotalDefaultComponentProps } from "./id/total-default/interface";
export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IFormFieldComponentProps
  | IAmountComponentProps
  | IIdTotalDefaultComponentProps
  | never;
