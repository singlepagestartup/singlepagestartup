import { IComponentProps as IProfileOverviewDefaultComponentProps } from "./profile/overview/default/interface";
import { IComponentProps as IChatListDefaultComponentProps } from "./chat/list/default/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";

export type IComponentProps =
  | IProfileOverviewDefaultComponentProps
  | IChatListDefaultComponentProps
  | IAdminSelectInputComponentProps
  | IAdminTableComponentProps
  | IAdminFormComponentProps
  | IAdminTableRowComponentProps
  | IFindComponentProps
  | IDefaultComponentProps
  | never;
