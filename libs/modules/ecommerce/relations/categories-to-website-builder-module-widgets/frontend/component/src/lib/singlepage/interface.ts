import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IOverviewComponentProps } from "./overview/interface";

export type IComponentProps =
  | IAdminSelectInputComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminFormComponentProps
  | IFindComponentProps
  | IDefaultComponentProps
  | IOverviewComponentProps
  | never;
