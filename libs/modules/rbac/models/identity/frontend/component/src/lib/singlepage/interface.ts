import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as ICreateByEmailComponentProps } from "./create-by-email/interface";
import { IComponentProps as IFormFieldDefaultComponentProps } from "./form-field-default/interface";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | ICreateByEmailComponentProps
  | IFormFieldDefaultComponentProps
  | never;
