import type { RbacIdentity } from "../../../shared";

export const variant = "find-default";

export interface IdentityFindDefaultProps {
  variant?: "find-default";
  title: string;
  description: string;
  emptyLabel: string;
  identities: RbacIdentity[];
}

type IVariantInputs = NonNullable<Partial<IdentityFindDefaultProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "find-default";
}

export interface IComponentPropsExtended extends IComponentProps {}
