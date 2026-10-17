export const variant = "me-identity-create-email-and-password";

export interface IIdentityCreateProps {
  variant?: "me-identity-create-email-and-password";
  subjectId?: string;
  connected?: boolean;
  account?: string;
  reconnect?: boolean;
  onComplete: (account: string) => void;
}

type IVariantInputs = NonNullable<IIdentityCreateProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-identity-create-email-and-password";
}

export interface IComponentPropsExtended extends IComponentProps {}
