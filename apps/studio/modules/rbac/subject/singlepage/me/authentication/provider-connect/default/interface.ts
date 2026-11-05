export const variant = "me-authentication-provider-connect-default";

export interface IProviderConnectProps {
  variant?: "me-authentication-provider-connect-default";
  provider?: string;
  account?: string;
  onComplete?: (account: string) => void;
  onCancel?: () => void;
}

type IVariantInputs = NonNullable<IProviderConnectProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-authentication-provider-connect-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
