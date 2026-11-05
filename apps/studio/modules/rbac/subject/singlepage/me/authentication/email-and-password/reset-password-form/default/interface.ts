export const variant =
  "me-authentication-email-and-password-reset-password-form-default";

export interface ISubjectResetPasswordFormDefaultProps {
  variant?: "me-authentication-email-and-password-reset-password-form-default";
  title: string;
  description: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  submitLabel: string;
  backLabel: string;
  backHref: string;
  backStoryHref?: string;
}

type IVariantInputs = NonNullable<
  Partial<ISubjectResetPasswordFormDefaultProps>
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-email-and-password-reset-password-form-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
