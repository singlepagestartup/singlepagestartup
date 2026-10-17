import type { RbacIdentity } from "../../../../../shared";

export const variant = "me-identity-change-email";

export interface IIdentityChangeProps {
  variant?: "me-identity-change-email";
  subjectId?: string;
  identity: RbacIdentity;
  onUpdate: (identity: RbacIdentity) => void;
}

type IVariantInputs = NonNullable<IIdentityChangeProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-identity-change-email";
}

export interface IComponentPropsExtended extends IComponentProps {}
