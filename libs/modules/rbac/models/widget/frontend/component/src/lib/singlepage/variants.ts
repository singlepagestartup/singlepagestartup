import { Component as SubjectMeBlogModuleArticleCreate } from "./subject/me/blog-module/article/create";
import { Component as SubjectMeCrmModuleFormRequestCreate } from "./subject-me-crm-module-form-request-create";
import { Component as SubjectMeSocialModuleProfileChatOverviewDefault } from "./subject/me/social-module/profile/chat/overview-default";
import { Component as SubjectMeSocialModuleProfileChatListDefault } from "./subject/me/social-module/profile/chat/list-default";
import { Component as SubjectMeEcommerceModuleStoreOverviewDefault } from "./subject-me-ecommerce-module-store-overview-default";
import { Component as SubjectMeEcommerceModuleCategoryOverviewDefault } from "./subject-me-ecommerce-module-category-overview-default";
import { Component as SubjectMeEcommerceModuleProductOverviewDefault } from "./subject-me-ecommerce-module-product-overview-default";
import { Component as SubjectMeEcommerceModuleProductListDefault } from "./subject-me-ecommerce-module-product-list-default";
import { Component as SubjectEcommerceOrder } from "./subject-ecommerce-order";
import { Component as SubjectEcommerceProductListDefault } from "./subject-ecommerce-product-list-default";
import { Component as SubjectMeCrmModuleFormSupportAiChat } from "./subject-me-crm-module-form-support-ai-chat";
import { Component as SubjectMeAuthenticationResetPasswordAiChat } from "./subject-me-authentication-reset-password-ai-chat";
import { Component as SubjectMeAuthenticationForgotPasswordAiChat } from "./subject-me-authentication-forgot-password-ai-chat";
import { Component as SubjectMeAuthenticationRegistrationAiChat } from "./subject-me-authentication-registration-ai-chat";
import { Component as SubjectMeAuthenticationSelectMethodAiChat } from "./subject-me-authentication-select-method-ai-chat";
import { Component as SubjectMeProfileSettings } from "./subject-me-profile-settings";
import { Component as SubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat } from "./subject-me-social-module-profile-id-chat-id-thread-create-ai-chat";
import { Component as SubjectMeSocialModuleProfileIdSettingsAiChat } from "./subject-me-social-module-profile-id-settings-ai-chat";
import { Component as SubjectMeSocialModuleProfileIdChatIdThreadIdAiChat } from "./subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";
import { Component as SubjectMeSocialModuleProfileCreateAiChat } from "./subject-me-social-module-profile-create-ai-chat";
import { Component as SubjectListSocialModuleProfileDefault } from "./subject/list/social-module/profile/default";
import { Component as SubjectOverviewSocialModuleProfileOverviewDefault } from "./subject/overview/social-module/profile/overview/default";
import { Component as SubjectOverviewEcommerceModuleProductListDefault } from "./subject/overview/ecommerce-module/product/list/default";
import { Component as Find } from "./find";
import { Component as AdminTableRow } from "./admin/table-row";
import { Component as AdminTable } from "./admin/table";
import { Component as AdminSelectInput } from "./admin/select-input";
import { Component as AdminForm } from "./admin/form";
import { Component as AdminV2TableRow } from "./admin-v2/table-row";
import { Component as AdminV2Table } from "./admin-v2/table";
import { Component as AdminV2SelectInput } from "./admin-v2/select-input";
import { Component as AdminV2Form } from "./admin-v2/form";
import { Component as AdminV2Card } from "./admin-v2/card";
import { Component as AdminV2SidebarItem } from "./admin-v2/sidebar-item";
import { Component as Default } from "./default";
import { Component as SubjectIdentitySettingsDefault } from "./subject/identity/settings-default";
import { Component as SubjectAuthenticationEmailAndPasswordForgotPasswordFormDefault } from "./subject/authentication/email-and-password/forgot-password-form-default";
import { Component as SubjectAuthenticationSelectMethodDefault } from "./subject/authentication/select-method-default";
import { Component as SubjectAuthenticationLogoutActionDefault } from "./subject/authentication/logout-action-default";
import { Component as SubjectAuthenticationEmailAndPasswordRegistrationFormDefault } from "./subject/authentication/email-and-password/registration-form-default";
import { Component as SubjectAuthenticationEmailAndPasswordResetPasswordFormDefault } from "./subject/authentication/email-and-password/reset-password-form-default";
import { Component as SubjectOverviewDefault } from "./subject/overview/default";
import { Component as SubjectListDefault } from "./subject/list/default";

export const variants = {
  "subject-me-blog-module-article-create": SubjectMeBlogModuleArticleCreate,
  "subject-me-crm-module-form-request-create":
    SubjectMeCrmModuleFormRequestCreate,
  "subject-me-social-module-profile-chat-overview-default":
    SubjectMeSocialModuleProfileChatOverviewDefault,
  "subject-me-social-module-profile-chat-list-default":
    SubjectMeSocialModuleProfileChatListDefault,
  "subject-me-ecommerce-module-store-overview-default":
    SubjectMeEcommerceModuleStoreOverviewDefault,
  "subject-me-ecommerce-module-category-overview-default":
    SubjectMeEcommerceModuleCategoryOverviewDefault,
  "subject-me-ecommerce-module-product-overview-default":
    SubjectMeEcommerceModuleProductOverviewDefault,
  "subject-me-ecommerce-module-product-list-default":
    SubjectMeEcommerceModuleProductListDefault,
  "subject-ecommerce-order": SubjectEcommerceOrder,
  "subject-ecommerce-product-list-default": SubjectEcommerceProductListDefault,
  "subject-me-crm-module-form-support-ai-chat":
    SubjectMeCrmModuleFormSupportAiChat,
  "subject-me-authentication-reset-password-ai-chat":
    SubjectMeAuthenticationResetPasswordAiChat,
  "subject-me-authentication-forgot-password-ai-chat":
    SubjectMeAuthenticationForgotPasswordAiChat,
  "subject-me-authentication-registration-ai-chat":
    SubjectMeAuthenticationRegistrationAiChat,
  "subject-me-authentication-select-method-ai-chat":
    SubjectMeAuthenticationSelectMethodAiChat,
  "subject-me-profile-settings": SubjectMeProfileSettings,
  "subject-me-social-module-profile-id-chat-id-thread-create-ai-chat":
    SubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat,
  "subject-me-social-module-profile-id-settings-ai-chat":
    SubjectMeSocialModuleProfileIdSettingsAiChat,
  "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat":
    SubjectMeSocialModuleProfileIdChatIdThreadIdAiChat,
  "subject-me-social-module-profile-create-ai-chat":
    SubjectMeSocialModuleProfileCreateAiChat,
  "subject-list-social-module-profile-default":
    SubjectListSocialModuleProfileDefault,
  "subject-overview-social-module-profile-overview-default":
    SubjectOverviewSocialModuleProfileOverviewDefault,
  "subject-overview-ecommerce-module-product-list-default":
    SubjectOverviewEcommerceModuleProductListDefault,
  find: Find,
  "admin-table-row": AdminTableRow,
  "admin-table": AdminTable,
  "admin-select-input": AdminSelectInput,
  "admin-form": AdminForm,
  "admin-v2-table-row": AdminV2TableRow,
  "admin-v2-table": AdminV2Table,
  "admin-v2-select-input": AdminV2SelectInput,
  "admin-v2-form": AdminV2Form,
  "admin-v2-card": AdminV2Card,
  "admin-v2-sidebar-item": AdminV2SidebarItem,
  "subject-authentication-email-and-password-forgot-password-form-default":
    SubjectAuthenticationEmailAndPasswordForgotPasswordFormDefault,
  "subject-authentication-select-method-default":
    SubjectAuthenticationSelectMethodDefault,
  "subject-authentication-logout-action-default":
    SubjectAuthenticationLogoutActionDefault,
  "subject-authentication-email-and-password-registration-form-default":
    SubjectAuthenticationEmailAndPasswordRegistrationFormDefault,
  "subject-authentication-email-and-password-reset-password-form-default":
    SubjectAuthenticationEmailAndPasswordResetPasswordFormDefault,
  default: Default,
  "subject-overview-default": SubjectOverviewDefault,
  "subject-list-default": SubjectListDefault,
  "subject-identity-settings-default": SubjectIdentitySettingsDefault,
};
