import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin-table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin-table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin-select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin-form";
import { IComponentProps as IDefaultComponentProps } from "./default";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview-default";
import { IComponentProps as ICardDefaultComponentProps } from "./card-default";
import { IComponentProps as IPriceDefaultComponentProps } from "./price-default";
import { IComponentProps as ICurrencyToggleGroupDefaultComponentProps } from "./currency-toggle-group-default";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IOverviewDefaultComponentProps
  | ICardDefaultComponentProps
  | IPriceDefaultComponentProps
  | ICurrencyToggleGroupDefaultComponentProps
  | never;
