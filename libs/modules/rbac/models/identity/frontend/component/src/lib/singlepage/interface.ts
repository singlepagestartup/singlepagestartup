import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form";
import { IComponentProps as IDefaultComponentProps } from "./default";
import { IComponentProps as ICreateByEmailComponentProps } from "./create-by-email";
import { IComponentProps as IFormFieldDefaultComponentProps } from "./form-field-default";

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
