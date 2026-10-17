import type { RbacIdentity } from "../../../../../shared";

export const variant = "me-identity-delete";

export interface IIdentityDeleteProps {
  variant?: "me-identity-delete";
  subjectId?: string;
  identity: RbacIdentity;
  onDelete: (identity: RbacIdentity) => void;
}

type IVariantInputs = NonNullable<IIdentityDeleteProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-identity-delete";
}

export interface IComponentPropsExtended extends IComponentProps {}
