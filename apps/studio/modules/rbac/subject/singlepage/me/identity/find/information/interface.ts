import type { RbacIdentity } from "../../../../../../shared";

export const variant = "me-identity-find-information";

export interface SubjectMeIdentityFindInformationProps {
  variant?: "me-identity-find-information";
  title?: string;
  description?: string;
  emptyLabel?: string;
  identities?: RbacIdentity[];
}

type IVariantInputs = NonNullable<SubjectMeIdentityFindInformationProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-identity-find-information";
}

export interface IComponentPropsExtended extends IComponentProps {}
