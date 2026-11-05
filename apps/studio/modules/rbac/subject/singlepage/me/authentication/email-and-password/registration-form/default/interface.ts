export const variant =
  "me-authentication-email-and-password-registration-form-default";

export interface ISubjectRegistrationFormDefaultProps {
  variant?: "me-authentication-email-and-password-registration-form-default";
  title: string;
  description: string;
  demoNote: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmLabel: string;
  confirmPlaceholder: string;
  termsLabel: string;
  termsHref: string;
  privacyHref: string;
  submitLabel: string;
  loginPrompt: string;
  loginLabel: string;
  loginHref: string;
}

type IVariantInputs = NonNullable<
  Partial<ISubjectRegistrationFormDefaultProps>
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-email-and-password-registration-form-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
