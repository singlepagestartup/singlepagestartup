export const variant =
  "me-authentication-email-and-password-forgot-password-form-default";

export interface ISubjectForgotPasswordFormDefaultProps {
  variant?: "me-authentication-email-and-password-forgot-password-form-default";
  title: string;
  description: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitLabel: string;
  backLabel: string;
  backHref: string;
  backStoryHref?: string;
  sent?: boolean;
  sentTitle: string;
  sentDescription: string;
  sentEmail: string;
}

type IVariantInputs = NonNullable<
  Partial<ISubjectForgotPasswordFormDefaultProps>
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-email-and-password-forgot-password-form-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
