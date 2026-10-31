import { IComponentProps as IHiddenComponentProps } from "@sps/shared-frontend-components/singlepage/hidden/interface";
import type { IComponentProps as IAuthorOverviewDefault } from "./author-overview-default/interface";
import type { IComponentProps as IAuthorBylineDefault } from "./author-byline-default/interface";
import type { IComponentProps as IAuthorCardDefault } from "./author-card-default/interface";
import type { IComponentProps as IByline } from "./byline/interface";
import type { IComponentProps as IAgentIdAiChat } from "./agent-id-ai-chat/interface";
import type { IComponentProps as IIdSettingsAiChat } from "./id-settings-ai-chat/interface";
import type { IComponentProps as ISidebarAiChatProject } from "./sidebar-ai-chat-project/interface";
import type { IComponentProps as ISelectItemAiChatProject } from "./select-item-ai-chat-project/interface";
import type { IComponentProps as ISelectAiChatProject } from "./select-ai-chat-project/interface";
import type { IComponentProps as IIdAiChatProject } from "./id-ai-chat-project/interface";
import { IComponentProps as IArticlesDefaultComponentProps } from "./articles-default/interface";
import { IComponentProps as IAdminV2SidebarItemComponentProps } from "./admin-v2/sidebar-item/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IOverviewDefaultComponentProps } from "./overview/default/interface";
import { IComponentProps as IButtonDefaultComponentProps } from "./button-default/interface";
import { IComponentProps as IChatProfileSidebarComponentProps } from "./chat-profile-sidebar/interface";
import { IComponentProps as IChatProfileAvatarComponentProps } from "./chat-profile-avatar/interface";
import { IComponentProps as IChatMessageRowComponentProps } from "./chat-message-row/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
export type IComponentProps =
  | IHiddenComponentProps
  | IAuthorOverviewDefault
  | IAuthorBylineDefault
  | IAuthorCardDefault
  | IByline
  | IAgentIdAiChat
  | IIdSettingsAiChat
  | ISidebarAiChatProject
  | IThreadListSidebarAiChat
  | ISelectItemAiChatProject
  | ISelectAiChatProject
  | IIdAiChatProject
  | IArticlesDefaultComponentProps
  | IOverviewDefaultComponentProps
  | IButtonDefaultComponentProps
  | IChatProfileSidebarComponentProps
  | IChatProfileAvatarComponentProps
  | IChatMessageRowComponentProps
  | IAdminSelectInputComponentProps
  | IAdminTableComponentProps
  | IAdminFormComponentProps
  | IAdminTableRowComponentProps
  | IDefaultComponentProps
  | IFindComponentProps
  | IAdminV2SidebarItemComponentProps
  | IAdminV2CardComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2TableRowComponentProps
  | never;
import type { IComponentProps as IThreadListSidebarAiChat } from "./thread-list-sidebar-ai-chat/interface";
