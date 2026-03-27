import { IComponentProps as IAdminV2SidebarItemComponentProps } from "./admin-v2/sidebar-item/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IFormListDefaultComponentProps } from "./form/list/default/interface";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IFormListDefaultComponentProps
  | IAdminV2SidebarItemComponentProps
  | IAdminV2CardComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2TableRowComponentProps
  | never;
