import { IComponentProps as ISelectOptionDefaultComponentProps } from "./select-option-default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as ITextDefaultComponentProps } from "./text-default/interface";
import { IComponentProps as ITextareaDefaultComponentProps } from "./textarea-default/interface";

export type IComponentProps =
  | ISelectOptionDefaultComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | ITextDefaultComponentProps
  | ITextareaDefaultComponentProps
  | never;
