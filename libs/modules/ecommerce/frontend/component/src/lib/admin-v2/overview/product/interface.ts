import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2-table/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2-card/interface";

export type IComponentProps =
  | IAdminV2CardComponentProps
  | IAdminV2TableComponentProps;
