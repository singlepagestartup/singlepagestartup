import { IComponentProps as IFindComponentProps } from "./find";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table";
import { IComponentProps as IDefaultComponentProps } from "./default";
import { IComponentProps as IContentDefaultComponentProps } from "./content-default";
import { IComponentProps as IFooterDefaultComponentProps } from "./footer-default";
import { IComponentProps as INavbarDefaultComponentProps } from "./navbar-default";
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
