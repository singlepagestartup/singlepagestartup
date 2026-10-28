import { IComponentProps as IHiddenComponentProps } from "@sps/shared-frontend-components/singlepage/hidden/interface";
import type { IComponentProps as IActionOutlineInverse } from "./action-outline-inverse/interface";
import type { IComponentProps as IFooterLink } from "./footer-link/interface";
import type { IComponentProps as INavigationInverse } from "./navigation-inverse/interface";
import type { IComponentProps as INavigation } from "./navigation/interface";
import type { IComponentProps as IAction } from "./action/interface";
import type { IComponentProps as IActionInverse } from "./action-inverse/interface";
import type { IComponentProps as IRepository } from "./repository/interface";
import type { IComponentProps as IRepositoryLink } from "./repository-link/interface";
import type { IComponentProps as ITextAction } from "./text-action/interface";
import { IComponentProps as IAdminV2SidebarItemComponentProps } from "./admin-v2/sidebar-item/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
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
  | IHiddenComponentProps
  | IActionOutlineInverse
  | IFooterLink
  | INavigationInverse
  | INavigation
  | IAction
  | IActionInverse
  | IRepository
  | IRepositoryLink
  | ITextAction
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
  | IAdminV2SidebarItemComponentProps
  | IAdminV2CardComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2TableRowComponentProps
  | IDefaultComponentProps
  | IChildrenComponentProps;
