export const variant =
  "me-authentication-email-and-password-registration-form-ai-chat";

export interface IRegisterCopy {
  title: string;
  description: string[];
  successDescription: string[];
  labels: Record<string, string>;
}

export interface IRegisterProps {
  variant?: "me-authentication-email-and-password-registration-form-ai-chat";
  copy?: IRegisterCopy;
}

export interface IRegisterErrors {
  email?: string;
  password?: string;
  repeatedPassword?: string;
}

type IVariantInputs = NonNullable<IRegisterProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-email-and-password-registration-form-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
