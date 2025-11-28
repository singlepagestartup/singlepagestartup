import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as ILinkComponentProps } from "./link/interface";
import { IComponentProps as IGhostComponentProps } from "./ghost/interface";
import { IComponentProps as IOutlineComponentProps } from "./outline/interface";
import { IComponentProps as IDestructiveComponentProps } from "./destructive/interface";
import { IComponentProps as ISecondaryComponentProps } from "./secondary/interface";
import { IComponentProps as IPrimaryComponentProps } from "./primary/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IChildrenComponentProps } from "./children/interface";

export type IComponentProps =
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | ILinkComponentProps
  | IGhostComponentProps
  | IOutlineComponentProps
  | IDestructiveComponentProps
  | ISecondaryComponentProps
  | IPrimaryComponentProps
  | IDefaultComponentProps
  | IChildrenComponentProps;
