export const variant = "me-authentication-select-method-default";

export type TAuthenticationMethod =
  | "email-and-password"
  | "ethereum-virtual-machine"
  | "oauth";

export interface ISelectMethodProps {
  variant?: "me-authentication-select-method-default";
  initialMethod?: TAuthenticationMethod;

  onSuccess?: (email: string) => void;
}

type IVariantInputs = NonNullable<ISelectMethodProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-select-method-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
