import type { RbacSubject } from "../../../shared";

export const variant = "me-information";

export interface SubjectMeInformationProps {
  variant?: "me-information";
  subject: RbacSubject;
  title: string;
  description: string;
}

type IVariantInputs = NonNullable<Partial<SubjectMeInformationProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-information";
}

export interface IComponentPropsExtended extends IComponentProps {}
