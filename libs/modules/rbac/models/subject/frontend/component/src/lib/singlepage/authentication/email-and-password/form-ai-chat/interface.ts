import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant =
  "authentication-email-and-password-form-ai-chat" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  mode:
    | "authentication"
    | "registration"
    | "forgot-password"
    | "reset-password";
}
export type IComponentPropsExtended = IComponentProps;
