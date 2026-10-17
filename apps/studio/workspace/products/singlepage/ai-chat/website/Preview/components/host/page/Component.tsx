import type { ComponentProps, ComponentType } from "react";
import { Component as AiChat } from "./singlepage/ai-chat/index";
import { Component as AiChatHelp } from "./singlepage/ai-chat-help/index";
import { Component as RbacModuleSubjectMeAuthenticationRegistrationAiChat } from "./singlepage/rbac-module-subject-me-authentication-registration-ai-chat/index";
import { Component as RbacModuleSubjectMeAuthenticationSelectMethodAiChat } from "./singlepage/rbac-module-subject-me-authentication-select-method-ai-chat/index";
import { Component as RbacModuleSubjectMeSettingsAiChat } from "./singlepage/rbac-module-subject-me-settings-ai-chat/index";
import { Component as RbacModuleSubjectMeEcommerceModuleOrderCheckoutTokensAiChat } from "./singlepage/rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat/index";
import { Component as RbacModuleSubjectMeSocialModuleProfileCreateAiChat } from "./singlepage/rbac-module-subject-me-social-module-profile-create-ai-chat/index";
import { Component as RbacModuleSubjectMeSocialModuleProfileIdChatIdThreadIdAiChat } from "./singlepage/rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/index";
import { Component as RbacModuleSubjectMeSocialModuleProfileIdSettingsAiChat } from "./singlepage/rbac-module-subject-me-social-module-profile-id-settings-ai-chat/index";
import { Component as RbacModuleSubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat } from "./singlepage/rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat/index";
const variants = {
  "ai-chat": AiChat,
  "ai-chat-help": AiChatHelp,
  "rbac-module-subject-me-authentication-registration-ai-chat":
    RbacModuleSubjectMeAuthenticationRegistrationAiChat,
  "rbac-module-subject-me-authentication-select-method-ai-chat":
    RbacModuleSubjectMeAuthenticationSelectMethodAiChat,
  "rbac-module-subject-me-settings-ai-chat": RbacModuleSubjectMeSettingsAiChat,
  "rbac-module-subject-me-ecommerce-module-order-checkout-tokens-ai-chat":
    RbacModuleSubjectMeEcommerceModuleOrderCheckoutTokensAiChat,
  "rbac-module-subject-me-social-module-profile-create-ai-chat":
    RbacModuleSubjectMeSocialModuleProfileCreateAiChat,
  "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat":
    RbacModuleSubjectMeSocialModuleProfileIdChatIdThreadIdAiChat,
  "rbac-module-subject-me-social-module-profile-id-settings-ai-chat":
    RbacModuleSubjectMeSocialModuleProfileIdSettingsAiChat,
  "rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat":
    RbacModuleSubjectMeSocialModuleProfileIdChatIdThreadCreateAiChat,
};
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
