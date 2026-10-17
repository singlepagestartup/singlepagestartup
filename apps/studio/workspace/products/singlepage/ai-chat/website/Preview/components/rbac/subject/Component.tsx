import type { ComponentProps, ComponentType } from "react";
import { Component as Account } from "./singlepage/account/index";
import { Component as MessageCreateAiChat } from "./singlepage/message/create/ai-chat/index";
import { Component as AuthenticationEmailAndPasswordRegistrationFormAiChat } from "./singlepage/authentication/email-and-password/registration-form/ai-chat/index";
import { Component as AuthenticationEmailAndPasswordAuthenticationFormAiChat } from "./singlepage/authentication/email-and-password/authentication-form/ai-chat/index";
import { Component as MeProfileInformation } from "./singlepage/me-profile-information/index";
import { Component as MeIdentityFindInformation } from "./singlepage/me-identity-find-information/index";
import { Component as AccountData } from "./singlepage/account-data/index";
const variants = {
  account: Account,
  "message-create-ai-chat": MessageCreateAiChat,
  "authentication-email-and-password-registration-form-ai-chat":
    AuthenticationEmailAndPasswordRegistrationFormAiChat,
  "authentication-email-and-password-authentication-form-ai-chat":
    AuthenticationEmailAndPasswordAuthenticationFormAiChat,
  "me-profile-information": MeProfileInformation,
  "me-identity-find-information": MeIdentityFindInformation,
  "account-data": AccountData,
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
