import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2ModuleOverviewCardComponentProps } from "./admin-v2/module-overview-card/interface";
import { IComponentProps as IAdminV2ModelHeaderComponentProps } from "./admin-v2/model-header/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IAdminV2TableRowComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2ModuleOverviewCardComponentProps
  | IAdminV2ModelHeaderComponentProps
  | IDefaultComponentProps
  | never;
