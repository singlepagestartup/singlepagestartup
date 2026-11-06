import type { ReactNode, HTMLAttributes } from "react";

export const variant =
  "me-authentication-email-and-password-authentication-form-default";

export interface ISubjectAuthenticationFormDefaultProps {
  variant?: "me-authentication-email-and-password-authentication-form-default";
  methodSelector?: ReactNode;
  methodContent?: ReactNode;
  showEmailFields?: boolean;
  emailPanelProps?: HTMLAttributes<HTMLDivElement>;
  onSuccess?: (email: string) => void;
  title: string;
  description: string;
  demoNote: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberLabel: string;
  forgotLabel: string;
  forgotHref: string;
  forgotStoryHref?: string;
  submitLabel: string;
  submitHref: string;
  submitStoryHref?: string;
  registerPrompt: string;
  registerLabel: string;
  registerHref: string;
  registerStoryHref?: string;
}

type IVariantInputs = NonNullable<
  Partial<ISubjectAuthenticationFormDefaultProps>
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-email-and-password-authentication-form-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
