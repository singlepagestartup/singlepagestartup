import type { RbacIdentity } from "../../../../../shared";

export const variant = "me-identity-change-password";

export interface IIdentityChangeProps {
  variant?: "me-identity-change-password";
  subjectId?: string;
  identity: RbacIdentity;
  onUpdate: (identity: RbacIdentity) => void;
}

type IVariantInputs = NonNullable<IIdentityChangeProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-identity-change-password";
}

export interface IComponentPropsExtended extends IComponentProps {}
