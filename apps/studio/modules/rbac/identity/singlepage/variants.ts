import { Component as AccountChange } from "./account-change";
import { Component as ProviderConnect } from "./provider-connect";
import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AuthenticationLoginAiChat } from "./authentication/login/ai-chat/index";
import { Component as AuthenticationRegisterAiChat } from "./authentication/register/ai-chat/index";
import { Component as CardDefault } from "./card-default/index";
import { Component as FindDefault } from "./find-default/index";
import { Component as List } from "./list/index";
import { Component as LoginDefault } from "./login-default/index";
import { Component as PasswordResetDefault } from "./password-reset-default/index";
import { Component as RegisterDefault } from "./register-default/index";
import { Component as ResetPasswordDefault } from "./reset-password-default/index";

export const variants = {
  "account-change": AccountChange,
  "provider-connect": ProviderConnect,
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "authentication-login-ai-chat": AuthenticationLoginAiChat,
  "authentication-register-ai-chat": AuthenticationRegisterAiChat,
  "card-default": CardDefault,
  "find-default": FindDefault,
  list: List,
  "login-default": LoginDefault,
  "password-reset-default": PasswordResetDefault,
  "register-default": RegisterDefault,
  "reset-password-default": ResetPasswordDefault,
};
