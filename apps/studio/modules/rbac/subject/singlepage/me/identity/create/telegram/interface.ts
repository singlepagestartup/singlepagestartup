export const variant = "me-identity-create-telegram";

export interface IIdentityCreateProps {
  variant?: "me-identity-create-telegram";
  subjectId?: string;
  connected?: boolean;
  account?: string;
  reconnect?: boolean;
  onComplete: (account: string) => void;
}

type IVariantInputs = NonNullable<IIdentityCreateProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-identity-create-telegram";
}

export interface IComponentPropsExtended extends IComponentProps {}
