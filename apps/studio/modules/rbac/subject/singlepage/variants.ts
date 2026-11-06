import { Component as MeBlogModuleArticleCreateDefault } from "./me-blog-module-article-create-default";
import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Settings } from "./admin-v2-settings/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as MeCrmModuleFormDefault } from "./me-crm-module-form-default/index";
import { Component as MeInformation } from "./me-information/index";
import { Component as MeSocialModuleProfileFindInformation } from "./me-social-module-profile-find-information/index";
import { Component as MeAccount } from "./me/account/index";
import { Component as MeAuthenticationEmailAndPasswordAccountChangeDefault } from "./me/authentication/email-and-password/account-change/default/index";
import { Component as MeAuthenticationEmailAndPasswordAuthenticationFormAiChat } from "./me/authentication/email-and-password/authentication-form/ai-chat/index";
import { Component as MeAuthenticationEmailAndPasswordAuthenticationFormDefault } from "./me/authentication/email-and-password/authentication-form/default/index";
import { Component as MeAuthenticationEmailAndPasswordForgotPasswordFormDefault } from "./me/authentication/email-and-password/forgot-password-form/default/index";
import { Component as MeAuthenticationEmailAndPasswordRegistrationFormAiChat } from "./me/authentication/email-and-password/registration-form/ai-chat/index";
import { Component as MeAuthenticationEmailAndPasswordRegistrationFormDefault } from "./me/authentication/email-and-password/registration-form/default/index";
import { Component as MeAuthenticationEmailAndPasswordResetPasswordFormDefault } from "./me/authentication/email-and-password/reset-password-form/default/index";
import { Component as MeAuthenticationEthereumVirtualMachineDefault } from "./me/authentication/ethereum-virtual-machine/default/index";
import { Component as MeAuthenticationOauthAuthorizationDefault } from "./me/authentication/oauth/authorization/default/index";
import { Component as MeAuthenticationProviderConnectDefault } from "./me/authentication/provider-connect/default/index";
import { Component as MeAuthenticationSelectMethodAiChat } from "./me/authentication/select-method/ai-chat/index";
import { Component as MeAuthenticationSelectMethodDefault } from "./me/authentication/select-method/default/index";
import { Component as MeCrmModuleFormSupportAiChat } from "./me/crm-module/form/support/ai-chat/index";
import { Component as MeDeleteAiChat } from "./me/delete/ai-chat/index";
import { Component as MeDeleteDefault } from "./me/delete/default/index";
import { Component as MeEcommerceModuleOrderCheckoutTokensAiChat } from "./me/ecommerce-module/order/checkout/tokens/ai-chat/index";
import { Component as MeEcommerceModuleOrderListAiChat } from "./me/ecommerce-module/order/list/ai-chat/index";
import { Component as MeIdentityChangeEmail } from "./me/identity/change-email/index";
import { Component as MeIdentityChangePassword } from "./me/identity/change-password/index";
import { Component as MeIdentityCreateEmailAndPassword } from "./me/identity/create/email-and-password/index";
import { Component as MeIdentityCreateEthereumVirtualMachine } from "./me/identity/create/ethereum-virtual-machine/index";
import { Component as MeIdentityCreateOauthGoogle } from "./me/identity/create/oauth-google/index";
import { Component as MeIdentityCreateTelegram } from "./me/identity/create/telegram/index";
import { Component as MeIdentityDelete } from "./me/identity/delete/index";
import { Component as MeIdentityFindInformation } from "./me/identity/find/information/index";
import { Component as MeSocialModuleProfileCreateAiChat } from "./me/social-module/profile/create/ai-chat/index";
import { Component as MeSocialModuleProfileIdChatIdThreadCreateFormAiChat } from "./me/social-module/profile/id/chat/id/thread/create/form/ai-chat/index";
import { Component as MeSocialModuleProfileIdChatIdThreadIdKnowledgeModuleSourceListDocumentAiChat } from "./me/social-module/profile/id/chat/id/thread/id/knowledge-module/source/list/document/ai-chat/index";
import { Component as MeSocialModuleProfileIdChatIdThreadIdKnowledgeModuleSourceUpdateAiChat } from "./me/social-module/profile/id/chat/id/thread/id/knowledge-module/source/update/ai-chat/index";
import { Component as MeSocialModuleProfileIdChatIdThreadIdMessageCreateAiChat } from "./me/social-module/profile/id/chat/id/thread/id/message/create/ai-chat/index";
import { Component as MeSocialModuleProfileIdSettingsAiChat } from "./me/social-module/profile/id/settings/ai-chat/index";
import { Component as MeSocialModuleProfileIdUpdateNameAiChat } from "./me/social-module/profile/id/update-name/ai-chat/index";
import { Component as MeSocialModuleProfileSelectAiChat } from "./me/social-module/profile/select/ai-chat/index";

export const variants = {
  "me-blog-module-article-create-default": MeBlogModuleArticleCreateDefault,
  "admin-v2-card": AdminV2Card,
  "admin-v2-settings": AdminV2Settings,
  "admin-v2-table": AdminV2Table,
  "me-crm-module-form-default": MeCrmModuleFormDefault,
  "me-information": MeInformation,
  "me-social-module-profile-find-information":
    MeSocialModuleProfileFindInformation,
  "me-account": MeAccount,
  "me-authentication-email-and-password-account-change-default":
    MeAuthenticationEmailAndPasswordAccountChangeDefault,
  "me-authentication-email-and-password-authentication-form-ai-chat":
    MeAuthenticationEmailAndPasswordAuthenticationFormAiChat,
  "me-authentication-email-and-password-authentication-form-default":
    MeAuthenticationEmailAndPasswordAuthenticationFormDefault,
  "me-authentication-email-and-password-forgot-password-form-default":
    MeAuthenticationEmailAndPasswordForgotPasswordFormDefault,
  "me-authentication-email-and-password-registration-form-ai-chat":
    MeAuthenticationEmailAndPasswordRegistrationFormAiChat,
  "me-authentication-email-and-password-registration-form-default":
    MeAuthenticationEmailAndPasswordRegistrationFormDefault,
  "me-authentication-email-and-password-reset-password-form-default":
    MeAuthenticationEmailAndPasswordResetPasswordFormDefault,
  "me-authentication-ethereum-virtual-machine-default":
    MeAuthenticationEthereumVirtualMachineDefault,
  "me-authentication-oauth-authorization-default":
    MeAuthenticationOauthAuthorizationDefault,
  "me-authentication-provider-connect-default":
    MeAuthenticationProviderConnectDefault,
  "me-authentication-select-method-ai-chat": MeAuthenticationSelectMethodAiChat,
  "me-authentication-select-method-default":
    MeAuthenticationSelectMethodDefault,
  "me-crm-module-form-support-ai-chat": MeCrmModuleFormSupportAiChat,
  "me-delete-ai-chat": MeDeleteAiChat,
  "me-delete": MeDeleteDefault,
  "me-ecommerce-module-order-checkout-tokens-ai-chat":
    MeEcommerceModuleOrderCheckoutTokensAiChat,
  "me-ecommerce-module-order-list-ai-chat": MeEcommerceModuleOrderListAiChat,
  "me-identity-change-email": MeIdentityChangeEmail,
  "me-identity-change-password": MeIdentityChangePassword,
  "me-identity-create-email-and-password": MeIdentityCreateEmailAndPassword,
  "me-identity-create-ethereum-virtual-machine":
    MeIdentityCreateEthereumVirtualMachine,
  "me-identity-create-oauth-google": MeIdentityCreateOauthGoogle,
  "me-identity-create-telegram": MeIdentityCreateTelegram,
  "me-identity-delete": MeIdentityDelete,
  "me-identity-find-information": MeIdentityFindInformation,
  "me-social-module-profile-create-ai-chat": MeSocialModuleProfileCreateAiChat,
  "me-social-module-profile-id-chat-id-thread-create-form-ai-chat":
    MeSocialModuleProfileIdChatIdThreadCreateFormAiChat,
  "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat":
    MeSocialModuleProfileIdChatIdThreadIdKnowledgeModuleSourceListDocumentAiChat,
  "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-update-ai-chat":
    MeSocialModuleProfileIdChatIdThreadIdKnowledgeModuleSourceUpdateAiChat,
  "me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat":
    MeSocialModuleProfileIdChatIdThreadIdMessageCreateAiChat,
  "me-social-module-profile-id-settings-ai-chat":
    MeSocialModuleProfileIdSettingsAiChat,
  "me-social-module-profile-id-update-name-ai-chat":
    MeSocialModuleProfileIdUpdateNameAiChat,
  "me-social-module-profile-select-ai-chat": MeSocialModuleProfileSelectAiChat,
};
