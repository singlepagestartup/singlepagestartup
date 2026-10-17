export const variant = "me-identity-create-oauth-google";

export interface IIdentityCreateProps {
  variant?: "me-identity-create-oauth-google";
  subjectId?: string;
  connected?: boolean;
  account?: string;
  reconnect?: boolean;
  onComplete: (account: string) => void;
}

type IVariantInputs = NonNullable<IIdentityCreateProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-identity-create-oauth-google";
}

export interface IComponentPropsExtended extends IComponentProps {}
