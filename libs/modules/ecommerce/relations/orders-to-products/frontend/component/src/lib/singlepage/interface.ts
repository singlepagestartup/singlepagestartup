import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin-table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin-table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin-select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin-form";
import { IComponentProps as IDefaultComponentProps } from "./default";
import { IComponentProps as IQuantityComponentProps } from "./quantity";
import { IComponentProps as IAmountComponentProps } from "./amount";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IQuantityComponentProps
  | IAmountComponentProps
  | never;
