import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IDefaultComponentProps } from "./default";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form";
export type IComponentProps =
  | IFindComponentProps
  | IDefaultComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | never;
