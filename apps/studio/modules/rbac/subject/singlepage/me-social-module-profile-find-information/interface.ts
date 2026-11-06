import type { RbacAccountProfile } from "../../../shared";

export const variant = "me-social-module-profile-find-information";

export interface SubjectMeSocialModuleProfileFindInformationProps {
  variant?: "me-social-module-profile-find-information";
  title: string;
  description: string;
  profiles: RbacAccountProfile[];
}

type IVariantInputs = NonNullable<
  Partial<SubjectMeSocialModuleProfileFindInformationProps>
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-social-module-profile-find-information";
}

export interface IComponentPropsExtended extends IComponentProps {}
