import { IComponentProps as IUrlSegmentValueComponentProps } from "./url-segment-value";
import { IComponentProps as IFindByUrlComponentProps } from "./find-by-url";
import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form";
import { IComponentProps as IDefaultComponentProps } from "./default";
export type IComponentProps =
  | IUrlSegmentValueComponentProps
  | IFindByUrlComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | never;
