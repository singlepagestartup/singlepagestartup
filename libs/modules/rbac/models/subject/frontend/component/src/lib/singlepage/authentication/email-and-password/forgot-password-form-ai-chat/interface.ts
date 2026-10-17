import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant =
  "me-authentication-email-and-password-forgot-password-form-ai-chat" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
}
export type IComponentPropsExtended = IComponentProps;
