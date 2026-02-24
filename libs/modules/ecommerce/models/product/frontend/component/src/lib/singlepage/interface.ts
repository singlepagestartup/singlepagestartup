import { IComponentProps as ICartDefaultComponentProps } from "./cart/default/interface";
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
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview-default/interface";
import { IComponentProps as IPriceDefaultComponentProps } from "./price-default/interface";
import { IComponentProps as ICurrencyToggleGroupDefaultComponentProps } from "./currency/toggle-group-default/interface";

export type IComponentProps =
  | ICartDefaultComponentProps
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
  | IDefaultComponentProps
  | IOverviewDefaultComponentProps
  | IPriceDefaultComponentProps
  | ICurrencyToggleGroupDefaultComponentProps
  | never;
