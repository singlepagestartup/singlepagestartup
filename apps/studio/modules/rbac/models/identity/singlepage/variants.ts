import { Component as AdminV2Card } from "./admin-v2-card/index";
import { Component as AdminV2Table } from "./admin-v2-table/index";
import { Component as AiChatLogin } from "./ai-chat-login/index";
import { Component as AiChatRegister } from "./ai-chat-register/index";
import { Component as CardDefault } from "./card-default/index";
import { Component as Find } from "./find/index";
import { Component as FindDefault } from "./find-default/index";
import { Component as LoginDefault } from "./login-default/index";
import { Component as PasswordResetDefault } from "./password-reset-default/index";
import { Component as RegisterDefault } from "./register-default/index";
import { Component as ResetPasswordDefault } from "./reset-password-default/index";

export const variants = {
  "admin-v2-card": AdminV2Card,
  "admin-v2-table": AdminV2Table,
  "ai-chat-login": AiChatLogin,
  "ai-chat-register": AiChatRegister,
  "card-default": CardDefault,
  find: Find,
  "find-default": FindDefault,
  "login-default": LoginDefault,
  "password-reset-default": PasswordResetDefault,
  "register-default": RegisterDefault,
  "reset-password-default": ResetPasswordDefault,
};
