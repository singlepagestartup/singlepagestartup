import type { IComponentProps as INoIndexComponentProps } from "./noindex/interface";
import type { IComponentProps as IDocumentComponentProps } from "./document/interface";
import { IComponentProps as IHiddenComponentProps } from "@sps/shared-frontend-components/singlepage/hidden/interface";
import { IComponentProps as IAdminV2SidebarItemComponentProps } from "./admin-v2/sidebar-item/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IUrlSegmentValueComponentProps } from "./url-segment-value/interface";
import type { IComponentProps as IUrlSegmentValuesComponentProps } from "./url-segment-values/interface";
import { IComponentProps as IFindByUrlComponentProps } from "./find-by-url/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
export type IComponentProps =
  | INoIndexComponentProps
  | IDocumentComponentProps
  | IHiddenComponentProps
  | IUrlSegmentValuesComponentProps
  | IUrlSegmentValueComponentProps
  | IFindByUrlComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IDefaultComponentProps
  | IAdminV2SidebarItemComponentProps
  | IAdminV2CardComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2TableRowComponentProps
  | never;
