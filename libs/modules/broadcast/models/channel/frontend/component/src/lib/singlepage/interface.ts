import { IComponentProps as ISubscriptionComponentProps } from "./subscription";
import { IComponentProps as IFindByIdComponentProps } from "./find-by-id";
import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form";
import { IComponentProps as IDefaultComponentProps } from "./default";
export type IComponentProps =
  | ISubscriptionComponentProps
  | IFindByIdComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | never;
