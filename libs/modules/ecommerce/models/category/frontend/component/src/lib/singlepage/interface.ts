import { IComponentProps as IButtonDefaultComponentProps } from "./button-default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview-default/interface";

export type IComponentProps =
  | IButtonDefaultComponentProps
  | IFindComponentProps
  | IAdminFormComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IDefaultComponentProps
  | IOverviewDefaultComponentProps
  | never;
