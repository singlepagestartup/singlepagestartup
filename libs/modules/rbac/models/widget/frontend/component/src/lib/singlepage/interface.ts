import type { IComponentProps as ISubjectMeCrmModuleFormSupportAiChat } from "./subject-me-crm-module-form-support-ai-chat/interface";
import type { IComponentProps as ISubjectMeAuthenticationResetPasswordAiChat } from "./subject-me-authentication-reset-password-ai-chat/interface";
import type { IComponentProps as ISubjectMeAuthenticationForgotPasswordAiChat } from "./subject-me-authentication-forgot-password-ai-chat/interface";
import type { IComponentProps as ISubjectMeAuthenticationRegistrationAiChat } from "./subject-me-authentication-registration-ai-chat/interface";
import type { IComponentProps as ISubjectMeAuthenticationSelectMethodAiChat } from "./subject-me-authentication-select-method-ai-chat/interface";
import type { IComponentProps as ISubjectMeProfileSettings } from "./subject-me-profile-settings/interface";
import type { IComponentProps as ISubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat } from "./subject-me-social-module-profile-id-chat-id-thread-create-ai-chat/interface";
import type { IComponentProps as ISubjectMeSocialModuleProfileIdSettingsAiChat } from "./subject-me-social-module-profile-id-settings-ai-chat/interface";
import type { IComponentProps as ISubjectMeSocialModuleProfileIdChatIdThreadIdAiChat } from "./subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/interface";
import type { IComponentProps as ISubjectMeSocialModuleProfileCreateAiChat } from "./subject-me-social-module-profile-create-ai-chat/interface";
import { IComponentProps as ISubjectListSocialModuleProfileDefaultComponentProps } from "./subject/list/social-module/profile/default/interface";
import { IComponentProps as ISubjectOverviewSocialModuleProfileOverviewDefaultComponentProps } from "./subject/overview/social-module/profile/overview/default/interface";
import { IComponentProps as ISubjectOverviewEcommerceModuleProductListDefaultComponentProps } from "./subject/overview/ecommerce-module/product/list/default/interface";
import { IComponentProps as IFindComponentProps } from "./find/interface";
import { IComponentProps as IAdminTableRowComponentProps } from "./admin/table-row/interface";
import { IComponentProps as IAdminTableComponentProps } from "./admin/table/interface";
import { IComponentProps as IAdminSelectInputComponentProps } from "./admin/select-input/interface";
import { IComponentProps as IAdminFormComponentProps } from "./admin/form/interface";
import { IComponentProps as IAdminV2TableRowComponentProps } from "./admin-v2/table-row/interface";
import { IComponentProps as IAdminV2TableComponentProps } from "./admin-v2/table/interface";
import { IComponentProps as IAdminV2SelectInputComponentProps } from "./admin-v2/select-input/interface";
import { IComponentProps as IAdminV2FormComponentProps } from "./admin-v2/form/interface";
import { IComponentProps as IAdminV2CardComponentProps } from "./admin-v2/card/interface";
import { IComponentProps as IAdminV2SidebarItemComponentProps } from "./admin-v2/sidebar-item/interface";
import { IComponentProps as IDefaultComponentProps } from "./default/interface";
import { IComponentProps as ISubjectIdentitySettingsDefaultComponentProps } from "./subject/identity/settings-default/interface";
import { IComponentProps as ISubjectAuthenticationEmailAndPasswordForgotPasswordComponentProps } from "./subject/authentication/email-and-password/forgot-password-form-default/interface";
import { IComponentProps as ISubjectAuthenticationSelectMethodDefaultComponentProps } from "./subject/authentication/select-method-default/interface";
import { IComponentProps as ISubjectAuthenticationLogoutActionDefaultComponentProps } from "./subject/authentication/logout-action-default/interface";
import { IComponentProps as ISubjectAuthenticationEmailAndPasswordRegistrationFormDefaultComponentProps } from "./subject/authentication/email-and-password/registration-form-default/interface";
import { IComponentProps as ISubjectAuthenticationEmailAndPasswordResetPasswordFormDefaultComponentProps } from "./subject/authentication/email-and-password/reset-password-form-default/interface";
import { IComponentProps as ISubjectOverviewDefaultComponentProps } from "./subject/overview/default/interface";
import { IComponentProps as ISubjectListDefaultComponentProps } from "./subject/list/default/interface";

export type IComponentProps =
  | ISubjectMeCrmModuleFormSupportAiChat
  | ISubjectMeAuthenticationResetPasswordAiChat
  | ISubjectMeAuthenticationForgotPasswordAiChat
  | ISubjectMeAuthenticationRegistrationAiChat
  | ISubjectMeAuthenticationSelectMethodAiChat
  | ISubjectMeProfileSettings
  | ISubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat
  | ISubjectMeSocialModuleProfileIdSettingsAiChat
  | ISubjectMeSocialModuleProfileIdChatIdThreadIdAiChat
  | ISubjectMeSocialModuleProfileCreateAiChat
  | ISubjectListSocialModuleProfileDefaultComponentProps
  | ISubjectOverviewSocialModuleProfileOverviewDefaultComponentProps
  | ISubjectOverviewEcommerceModuleProductListDefaultComponentProps
  | IFindComponentProps
  | IAdminTableRowComponentProps
  | IAdminTableComponentProps
  | IAdminSelectInputComponentProps
  | IAdminFormComponentProps
  | IAdminV2TableRowComponentProps
  | IAdminV2TableComponentProps
  | IAdminV2SelectInputComponentProps
  | IAdminV2FormComponentProps
  | IAdminV2CardComponentProps
  | IAdminV2SidebarItemComponentProps
  | IDefaultComponentProps
  | ISubjectIdentitySettingsDefaultComponentProps
  | ISubjectAuthenticationEmailAndPasswordForgotPasswordComponentProps
  | ISubjectAuthenticationSelectMethodDefaultComponentProps
  | ISubjectAuthenticationLogoutActionDefaultComponentProps
  | ISubjectAuthenticationEmailAndPasswordRegistrationFormDefaultComponentProps
  | ISubjectAuthenticationEmailAndPasswordResetPasswordFormDefaultComponentProps
  | ISubjectOverviewDefaultComponentProps
  | ISubjectListDefaultComponentProps
  | never;
