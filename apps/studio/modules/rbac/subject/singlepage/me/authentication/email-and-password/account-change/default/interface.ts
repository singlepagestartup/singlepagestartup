export const variant =
  "me-authentication-email-and-password-account-change-default";

export interface IAccountChangeProps {
  variant?: "me-authentication-email-and-password-account-change-default";
  kind?: "email" | "password";
  email?: string;
  onComplete?: (email?: string) => void;
  onCancel?: () => void;
}

type IVariantInputs = NonNullable<IAccountChangeProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-email-and-password-account-change-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
