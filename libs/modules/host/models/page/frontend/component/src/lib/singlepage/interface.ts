import { IComponentProps as IAIChatPageHelpProps } from "./ai-chat-help/interface";
import { IComponentProps as IAIChatPageSettingsProps } from "./ai-chat-settings/interface";
import { IComponentProps as IAIChatPageTokensProps } from "./ai-chat-tokens/interface";
import { IComponentProps as IAIChatPageProjectsProjectIdProps } from "./ai-chat-projects-project-id/interface";
import { IComponentProps as IAIChatPageProjectsNewProps } from "./ai-chat-projects-new/interface";
import { IComponentProps as IAIChatPageLoginProps } from "./ai-chat-login/interface";
import { IComponentProps as IAIChatPageRegisterProps } from "./ai-chat-register/interface";
import { IComponentProps as IAIChatPageProps } from "./ai-chat/interface";
import { IComponentProps as IAdminV2SidebarItemComponentProps } from "./admin-v2/sidebar-item/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IUrlSegmentValueComponentProps } from "./url-segment-value/interface";
import { IComponentProps as IFindByUrlComponentProps } from "./find-by-url/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
export type IComponentProps =
  | IAIChatPageHelpProps
  | IAIChatPageSettingsProps
  | IAIChatPageTokensProps
  | IAIChatPageProjectsProjectIdProps
  | IAIChatPageProjectsNewProps
  | IAIChatPageLoginProps
  | IAIChatPageRegisterProps
  | IAIChatPageProps
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
