import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IContentDefaultComponentProps } from "./content-default/interface";
import { IComponentProps as IFooterDefaultComponentProps } from "./footer-default/interface";
import { IComponentProps as INavbarDefaultComponentProps } from "./navbar-default/interface";
export type IComponentProps =
  | IFindComponentProps
  | IAdminSelectInputComponentProps
  | IAdminTableRowComponentProps
  | IAdminFormComponentProps
  | IAdminTableComponentProps
  | IDefaultComponentProps
  | IContentDefaultComponentProps
  | IFooterDefaultComponentProps
  | INavbarDefaultComponentProps
  | never;
