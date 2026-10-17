export const variant =
  "me-authentication-email-and-password-authentication-form-ai-chat";

export interface ILoginCopy {
  title: string;
  description: string[];
  successDescription: string[];
  labels: Record<string, string>;
}

export interface ILoginProps {
  variant?: "me-authentication-email-and-password-authentication-form-ai-chat";
  copy?: ILoginCopy;
  onSuccess?: (email: string) => void;
}

export interface ILoginErrors {
  email?: string;
  password?: string;
}

type IVariantInputs = NonNullable<ILoginProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-email-and-password-authentication-form-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
