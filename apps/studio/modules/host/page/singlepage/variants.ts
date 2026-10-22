import { Component as AdminDashboard } from "./admin-dashboard/index";
import { Component as AdminEntityDrawer } from "./admin-entity-drawer/index";
import { Component as AdminModelEdit } from "./admin-model-edit/index";
import { Component as AdminModelList } from "./admin-model-list/index";
import { Component as AdminModuleDashboard } from "./admin-module-dashboard/index";
import { Component as AdminPreviewDialog } from "./admin-preview-dialog/index";
import { Component as AdminSettings } from "./admin-settings/index";
import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Form } from "./admin-v2-form/index";
import { Component as AdminV2List } from "./admin-v2-list/index";
import { Component as AdminV2SelectInput } from "./admin-v2-select-input/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AiChat } from "./ai-chat/index";
import { Component as AiChatHelp } from "./ai-chat-help/index";
import { Component as BlogModuleArticleFind } from "./blog-module-article-find/index";
import { Component as BlogModuleArticlePrivateSlug } from "./blog-module-article-private-slug/index";
import { Component as BlogModuleArticleSlug } from "./blog-module-article-slug/index";
import { Component as BlogModuleCategorySlug } from "./blog-module-category-slug/index";
import { Component as Composition } from "./composition/index";
import { Component as Default } from "./default/index";
import { Component as EcommerceModuleCategorySlug } from "./ecommerce-module-category-slug/index";
import { Component as EcommerceModuleProductFind } from "./ecommerce-module-product-find/index";
import { Component as EcommerceModuleProductSlug } from "./ecommerce-module-product-slug/index";
import { Component as Framework } from "./framework/index";
import { Component as Privacy } from "./privacy/index";
import { Component as RbacModuleSubjectMeAuthenticationRegistrationAiChat } from "./rbac-module-subject-me-authentication-registration-ai-chat/index";
import { Component as RbacModuleSubjectMeAuthenticationResetPassword } from "./rbac-module-subject-me-authentication-reset-password/index";
import { Component as RbacModuleSubjectMeAuthenticationSelectMethod } from "./rbac-module-subject-me-authentication-select-method/index";
import { Component as RbacModuleSubjectMeAuthenticationSelectMethodAiChat } from "./rbac-module-subject-me-authentication-select-method-ai-chat/index";
import { Component as RbacModuleSubjectMeEcommerceModuleOrderCheckout } from "./rbac-module-subject-me-ecommerce-module-order-checkout/index";
import { Component as RbacModuleSubjectMeEcommerceModuleOrderCheckoutConfirmation } from "./rbac-module-subject-me-ecommerce-module-order-checkout-confirmation/index";
import { Component as RbacModuleSubjectMeEcommerceModuleOrderCheckoutPayment } from "./rbac-module-subject-me-ecommerce-module-order-checkout-payment/index";
import { Component as RbacModuleSubjectMeEcommerceModuleOrderCheckoutTokensAiChat } from "./rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat/index";
import { Component as RbacModuleSubjectMeSettings } from "./rbac-module-subject-me-settings/index";
import { Component as RbacModuleSubjectMeSettingsAiChat } from "./rbac-module-subject-me-settings-ai-chat/index";
import { Component as RbacModuleSubjectMeSocialModuleProfileCreateAiChat } from "./rbac-module-subject-me-social-module-profile-create-ai-chat/index";
import { Component as RbacModuleSubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat } from "./rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat/index";
import { Component as RbacModuleSubjectMeSocialModuleProfileIdChatIdThreadIdAiChat } from "./rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/index";
import { Component as RbacModuleSubjectMeSocialModuleProfileIdSettingsAiChat } from "./rbac-module-subject-me-social-module-profile-id-settings-ai-chat/index";
import { Component as RbacModuleSubjectMeSocialModuleProfileListAiChat } from "./rbac-module-subject-me-social-module-profile-list-ai-chat/index";
import { Component as Root } from "./root/index";
import { Component as SocialModuleChatIdThreadId } from "./social-module-chat-id-thread-id/index";
import { Component as SocialModuleProfileSlugAuthor } from "./social-module-profile-slug-author/index";
import { Component as Terms } from "./terms/index";

export const variants = {
  "admin-dashboard": AdminDashboard,
  "admin-entity-drawer": AdminEntityDrawer,
  "admin-model-edit": AdminModelEdit,
  "admin-model-list": AdminModelList,
  "admin-module-dashboard": AdminModuleDashboard,
  "admin-preview-dialog": AdminPreviewDialog,
  "admin-settings": AdminSettings,
  "admin-v2-card": AdminV2Card,
  "admin-v2-form": AdminV2Form,
  "admin-v2-list": AdminV2List,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-table": AdminV2Table,
  "ai-chat": AiChat,
  "ai-chat-help": AiChatHelp,
  "blog-module-article-find": BlogModuleArticleFind,
  "blog-module-article-private-slug": BlogModuleArticlePrivateSlug,
  "blog-module-article-slug": BlogModuleArticleSlug,
  "blog-module-category-slug": BlogModuleCategorySlug,
  composition: Composition,
  default: Default,
  "ecommerce-module-category-slug": EcommerceModuleCategorySlug,
  "ecommerce-module-product-find": EcommerceModuleProductFind,
  "ecommerce-module-product-slug": EcommerceModuleProductSlug,
  framework: Framework,
  privacy: Privacy,
  "rbac-module-subject-me-authentication-registration-ai-chat":
    RbacModuleSubjectMeAuthenticationRegistrationAiChat,
  "rbac-module-subject-me-authentication-reset-password":
    RbacModuleSubjectMeAuthenticationResetPassword,
  "rbac-module-subject-me-authentication-select-method":
    RbacModuleSubjectMeAuthenticationSelectMethod,
  "rbac-module-subject-me-authentication-select-method-ai-chat":
    RbacModuleSubjectMeAuthenticationSelectMethodAiChat,
  "rbac-module-subject-me-ecommerce-module-order-checkout":
    RbacModuleSubjectMeEcommerceModuleOrderCheckout,
  "rbac-module-subject-me-ecommerce-module-order-checkout-confirmation":
    RbacModuleSubjectMeEcommerceModuleOrderCheckoutConfirmation,
  "rbac-module-subject-me-ecommerce-module-order-checkout-payment":
    RbacModuleSubjectMeEcommerceModuleOrderCheckoutPayment,
  "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat":
    RbacModuleSubjectMeEcommerceModuleOrderCheckoutTokensAiChat,
  "rbac-module-subject-me-settings": RbacModuleSubjectMeSettings,
  "rbac-module-subject-me-settings-ai-chat": RbacModuleSubjectMeSettingsAiChat,
  "rbac-module-subject-me-social-module-profile-create-ai-chat":
    RbacModuleSubjectMeSocialModuleProfileCreateAiChat,
  "rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat":
    RbacModuleSubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat,
  "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat":
    RbacModuleSubjectMeSocialModuleProfileIdChatIdThreadIdAiChat,
  "rbac-module-subject-me-social-module-profile-id-settings-ai-chat":
    RbacModuleSubjectMeSocialModuleProfileIdSettingsAiChat,
  "rbac-module-subject-me-social-module-profile-list-ai-chat":
    RbacModuleSubjectMeSocialModuleProfileListAiChat,
  root: Root,
  "social-module-chat-id-thread-id": SocialModuleChatIdThreadId,
  "social-module-profile-slug-author": SocialModuleProfileSlugAuthor,
  terms: Terms,
};
