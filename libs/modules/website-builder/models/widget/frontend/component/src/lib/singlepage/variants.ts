import { Component as ContentRich } from "./content-rich";
import { Component as ContentCta } from "./content-cta";
import { Component as ContentProjectContext } from "./content-project-context";
import { Component as ContentShowcase } from "./content-showcase";
import { Component as ContentPageHeader } from "./content-page-header";
import { Component as ContentFeatureSplit } from "./content-feature-split";
import { Component as ContentFeatureSplitReverse } from "./content-feature-split-reverse";
import { Component as ContentDefinitionGrid } from "./content-definition-grid";
import { Component as ContentDefinitionGridPage } from "./content-definition-grid-page";
import { Component as ContentSteps } from "./content-steps";
import { Component as ContentOffer } from "./content-offer";
import { Component as ContentOfferCard } from "./content-offer-card";
import { Component as ContentFaq } from "./content-faq";
import { Component as ContentCollection } from "./content-collection";
import { Component as ContentForm } from "./content-form";
import { Component as ContentHero } from "./content-hero";
import { Component as ContentFeatureFindCard } from "./content-feature-find-card";
import { Component as ContentSocialChatDefault } from "./content/social/chat-default";
import { Component as ContentEcommerceDefault } from "./content-ecommerce-default";
import { Component as ContentAiChatResetPassword } from "./content-ai-chat-reset-password";
import { Component as ContentAiChatForgotPassword } from "./content-ai-chat-forgot-password";
import { Component as ContentAiChatRegistration } from "./content-ai-chat-registration";
import { Component as ContentAiChatAuthentication } from "./content-ai-chat-authentication";
import { Component as ContentAiChatHelp } from "./content-ai-chat-help";
import { Component as ContentAiChatMaterialsProcessing } from "./content-ai-chat-materials-processing";
import { Component as ContentAiChatProfileCreate } from "./content-ai-chat-profile-create";
import { Component as LandingAiChat } from "./landing-ai-chat";
import { Component as FooterAiChat } from "./footer-ai-chat";
import { Component as NavbarAiChat } from "./navbar-ai-chat";
import { Component as AdminV2SidebarItem } from "./admin-v2/sidebar-item";
import { Component as AdminV2Card } from "./admin-v2/card";
import { Component as AdminV2Form } from "./admin-v2/form";
import { Component as AdminV2SelectInput } from "./admin-v2/select-input";
import { Component as AdminV2Table } from "./admin-v2/table";
import { Component as AdminV2TableRow } from "./admin-v2/table-row";
import { Component as Find } from "./find";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminTable } from "./admin/table";
import { Component as Default } from "./default";
import { Component as ContentDefaultComponent } from "./content-default";
import { Component as FooterDefaultComponent } from "./footer-default";
import { Component as NavbarDefaultComponent } from "./navbar-default";
import { Component as ContentFeatureFindRow } from "./content-feature-find-row";
export const variants = {
  "content-rich": ContentRich,
  "content-cta": ContentCta,
  "content-project-context": ContentProjectContext,
  "content-showcase": ContentShowcase,
  "content-page-header": ContentPageHeader,
  "content-feature-split": ContentFeatureSplit,
  "content-feature-split-reverse": ContentFeatureSplitReverse,
  "content-definition-grid": ContentDefinitionGrid,
  "content-definition-grid-page": ContentDefinitionGridPage,
  "content-steps": ContentSteps,
  "content-offer": ContentOffer,
  "content-offer-card": ContentOfferCard,
  "content-faq": ContentFaq,

  "content-collection": ContentCollection,
  "content-form": ContentForm,
  "content-hero": ContentHero,
  "content-feature-find-card": ContentFeatureFindCard,

  "content-feature-find-row": ContentFeatureFindRow,
  "content-social-chat-default": ContentSocialChatDefault,
  "content-ecommerce-default": ContentEcommerceDefault,
  "content-ai-chat-reset-password": ContentAiChatResetPassword,
  "content-ai-chat-forgot-password": ContentAiChatForgotPassword,
  "content-ai-chat-registration": ContentAiChatRegistration,
  "content-ai-chat-authentication": ContentAiChatAuthentication,
  "content-ai-chat-help": ContentAiChatHelp,
  "content-ai-chat-materials-processing": ContentAiChatMaterialsProcessing,
  "content-ai-chat-profile-create": ContentAiChatProfileCreate,
  "landing-ai-chat": LandingAiChat,
  "footer-ai-chat": FooterAiChat,
  "navbar-ai-chat": NavbarAiChat,
  find: Find,
  "admin-select-input": AdminSelectInput,
  "admin-table-row": AdminTableRow,
  "admin-form": AdminForm,
  "admin-table": AdminTable,
  "admin-v2-table-row": AdminV2TableRow,
  "admin-v2-table": AdminV2Table,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-form": AdminV2Form,
  "admin-v2-card": AdminV2Card,
  "admin-v2-sidebar-item": AdminV2SidebarItem,
  default: Default,
  "content-default": ContentDefaultComponent,
  "footer-default": FooterDefaultComponent,
  "navbar-default": NavbarDefaultComponent,
};
