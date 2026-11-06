import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant =
  "me-authentication-email-and-password-authentication-form-ai-chat" as const;
export interface IComponentProps extends ISpsComponentBase {
  language?: string;
  variant: typeof variant;
}
export type IComponentPropsExtended = IComponentProps;
