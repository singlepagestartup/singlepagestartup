import type { IComponentProps as IContentRich } from "./content-rich/interface";
import type { IComponentProps as IContentCta } from "./content-cta/interface";
import type { IComponentProps as IContentProjectContext } from "./content-project-context/interface";
import type { IComponentProps as IContentShowcase } from "./content-showcase/interface";
import type { IComponentProps as IContentPageHeaderProps } from "./content-page-header/interface";
import type { IComponentProps as IContentFeatureSplitProps } from "./content-feature-split/interface";
import type { IComponentProps as IContentFeatureSplitReverseProps } from "./content-feature-split-reverse/interface";
import type { IComponentProps as IContentDefinitionGridProps } from "./content-definition-grid/interface";
import type { IComponentProps as IContentDefinitionGridPageProps } from "./content-definition-grid-page/interface";
import type { IComponentProps as IContentStepsProps } from "./content-steps/interface";
import type { IComponentProps as IContentOfferProps } from "./content-offer/interface";
import type { IComponentProps as IContentOfferCardProps } from "./content-offer-card/interface";
import type { IComponentProps as IContentFaqProps } from "./content-faq/interface";
import type { IComponentProps as IContentCollectionProps } from "./content-collection/interface";
import type { IComponentProps as IContentFormProps } from "./content-form/interface";
import type { IComponentProps as IContentHero } from "./content-hero/interface";
import type { IComponentProps as IContentFeatureFindCard } from "./content-feature-find-card/interface";
import type { IComponentProps as IContentSocialChatDefault } from "./content/social/chat-default/interface";
import type { IComponentProps as IContentEcommerceDefault } from "./content-ecommerce-default/interface";
import type { IComponentProps as IContentAiChatResetPassword } from "./content-ai-chat-reset-password/interface";
import type { IComponentProps as IContentAiChatForgotPassword } from "./content-ai-chat-forgot-password/interface";
import type { IComponentProps as IContentAiChatRegistration } from "./content-ai-chat-registration/interface";
import type { IComponentProps as IContentAiChatAuthentication } from "./content-ai-chat-authentication/interface";
import type { IComponentProps as IContentAiChatHelp } from "./content-ai-chat-help/interface";
import type { IComponentProps as IContentAiChatMaterialsProcessing } from "./content-ai-chat-materials-processing/interface";
import type { IComponentProps as IContentAiChatProfileCreate } from "./content-ai-chat-profile-create/interface";
import type { IComponentProps as ILandingAiChat } from "./landing-ai-chat/interface";
import type { IComponentProps as IFooterAiChat } from "./footer-ai-chat/interface";
import type { IComponentProps as INavbarAiChat } from "./navbar-ai-chat/interface";
import { IComponentProps as IAdminV2SidebarItemComponentProps } from "./admin-v2/sidebar-item/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as IContentDefaultComponentProps } from "./content-default/interface";
import { IComponentProps as IFooterDefaultComponentProps } from "./footer-default/interface";
import { IComponentProps as INavbarDefaultComponentProps } from "./navbar-default/interface";
import type { IComponentProps as IContentFeatureFindRow } from "./content-feature-find-row/interface";
export type IComponentProps =
  | IContentRich
  | IContentCta
  | IContentProjectContext
  | IContentShowcase
  | IContentPageHeaderProps
  | IContentFeatureSplitProps
  | IContentFeatureSplitReverseProps
  | IContentDefinitionGridProps
  | IContentDefinitionGridPageProps
  | IContentStepsProps
  | IContentOfferProps
  | IContentOfferCardProps
  | IContentFaqProps
  | IContentCollectionProps
  | IContentFormProps
  | IContentHero
  | IContentFeatureFindCard
  | IContentFeatureFindRow
  | IContentSocialChatDefault
  | IContentEcommerceDefault
  | IContentAiChatResetPassword
  | IContentAiChatForgotPassword
  | IContentAiChatRegistration
  | IContentAiChatAuthentication
  | IContentAiChatHelp
  | IContentAiChatMaterialsProcessing
  | IContentAiChatProfileCreate
  | ILandingAiChat
  | IFooterAiChat
  | INavbarAiChat
  | IFindComponentProps
  | IAdminSelectInputComponentProps
  | IAdminTableRowComponentProps
  | IAdminFormComponentProps
  | IAdminTableComponentProps
  | IDefaultComponentProps
  | IContentDefaultComponentProps
  | IFooterDefaultComponentProps
  | INavbarDefaultComponentProps
  | IAdminV2SidebarItemComponentProps
  | IAdminV2CardComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2TableRowComponentProps
  | never;
