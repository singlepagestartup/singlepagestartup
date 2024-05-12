import type { IModel as IParentModel } from "@sps/sps-website-builder-models-layout-contracts";
import type { IModel as IFooter } from "@sps/sps-website-builder-models-footer-contracts";
import type { IModel as INavbar } from "@sps/sps-website-builder-models-navbar-contracts";
import type { IModel as IPage } from "@sps/sps-website-builder-models-page-contracts";
import type { IModel as ISidebar } from "@sps/sps-website-builder-models-sidebar-contracts";
import type { IModel as ITopbar } from "@sps/sps-website-builder-models-topbar-contracts";
import { IRelation as ILayoutsToNavbars } from "@sps/sps-website-builder-relations-layouts-to-navbars-contracts";
import { IRelation as ILayoutsToFooters } from "@sps/sps-website-builder-relations-layouts-to-footers-contracts";

export interface IModel extends IParentModel {
  topbar?: ITopbar | null;
  navbar?: INavbar | null;
  sidebar?: ISidebar | null;
  footer?: IFooter | null;
  pages?: IPage[] | null;
  SPSWBLayoutsToNavbars: ILayoutsToNavbars[];
  SPSWBLayoutsToFooters: ILayoutsToFooters[];
}
