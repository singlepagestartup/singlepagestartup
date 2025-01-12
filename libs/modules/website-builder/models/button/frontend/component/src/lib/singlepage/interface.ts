import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form";
import { IComponentProps as ILinkComponentProps } from "./link";
import { IComponentProps as IGhostComponentProps } from "./ghost";
import { IComponentProps as IOutlineComponentProps } from "./outline";
import { IComponentProps as IDestructiveComponentProps } from "./destructive";
import { IComponentProps as ISecondaryComponentProps } from "./secondary";
import { IComponentProps as IPrimaryComponentProps } from "./primary";
import { IComponentProps as IDefaultComponentProps } from "./default";

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
  | IDefaultComponentProps;
