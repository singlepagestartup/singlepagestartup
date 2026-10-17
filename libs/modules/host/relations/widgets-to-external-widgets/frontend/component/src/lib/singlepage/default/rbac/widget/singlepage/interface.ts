import type { IComponentProps as ISubjectMeSocialModuleProfileIdSettingsAiChat } from "./subject-me-social-module-profile-id-settings-ai-chat/interface";
import type { IComponentProps as ISubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat } from "./subject-me-social-module-profile-id-chat-id-thread-create-ai-chat/interface";
import type { IComponentProps as ISubjectMeSocialModuleProfileIdChatIdThreadIdAiChat } from "./subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/interface";
import { IComponentProps as ISubjectEcommerceOrderComponentProps } from "./subject/ecommerce/order/orders/interface";
import { IComponentProps as ISubjectEcommerceProductListDefaultComponentProps } from "./subject/ecommerce/product/list/default/interface";
import { IComponentProps as ISubjectIdentitySettingsDefaultComponentProps } from "./subject/identity/settings-default/interface";
import { IComponentProps as ISubjectListDefaultComponentProps } from "./subject/list/default/interface";
import { IComponentProps as ISubjectOverviewDefaultComponentProps } from "./subject/overview/default/interface";
import { IComponentProps as ISubjectOverviewEcommerceModuleProductListDefaultComponentProps } from "./subject/overview/ecommerce-module/product/list/default/interface";
import { IComponentProps as ISubjectOverviewSocialModuleProfileOverviewDefaultComponentProps } from "./subject/overview/social-module/profile/overview-default/interface";

export type IComponentProps =
  | ISubjectMeSocialModuleProfileIdSettingsAiChat
  | ISubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat
  | ISubjectMeSocialModuleProfileIdChatIdThreadIdAiChat
  | ISubjectEcommerceOrderComponentProps
  | ISubjectEcommerceProductListDefaultComponentProps
  | ISubjectIdentitySettingsDefaultComponentProps
  | ISubjectListDefaultComponentProps
  | ISubjectOverviewDefaultComponentProps
  | ISubjectOverviewEcommerceModuleProductListDefaultComponentProps
  | ISubjectOverviewSocialModuleProfileOverviewDefaultComponentProps;
