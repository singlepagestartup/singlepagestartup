import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant =
  "authentication-email-and-password-form-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  language?: string;
  variant: typeof variant;
  mode:
    | "authentication"
    | "registration"
    | "forgot-password"
    | "reset-password";
  successHref?: string;
  className?: string;
}
export type IComponentPropsExtended = IComponentProps;
