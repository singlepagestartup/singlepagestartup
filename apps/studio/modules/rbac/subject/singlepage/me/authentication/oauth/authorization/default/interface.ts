export const variant = "me-authentication-oauth-authorization-default";

export interface IOAuthAuthorizationProps {
  variant?: "me-authentication-oauth-authorization-default";
  initialState?: "idle" | "authorize" | "complete" | "error";
  providerName?: string;
  accountEmail?: string;
  onSuccess?: () => void;
}

type IVariantInputs = NonNullable<IOAuthAuthorizationProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-oauth-authorization-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
