"use client";
import type { IComponentProps, ISelectMethodAiChatProps } from "./interface";
export type { ISelectMethodAiChatProps } from "./interface";

import {
  Component as EmailAndPasswordAuthenticationForm,
  type ILoginProps,
} from "../../email-and-password/authentication-form/ai-chat";

export function Component({
  variant = "me-authentication-select-method-ai-chat",
  ...props
}: IComponentProps = {}) {
  return (
    <div
      className="contents"
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <EmailAndPasswordAuthenticationForm
        {...props}
        variant="me-authentication-email-and-password-authentication-form-ai-chat"
      />
    </div>
  );
}
