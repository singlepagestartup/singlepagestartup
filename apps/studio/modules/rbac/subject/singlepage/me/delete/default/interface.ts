import type { RbacSubject } from "../../../../../shared";

export const variant = "me-delete";

export interface SubjectMeDeleteProps {
  variant?: "me-delete";
  title: string;
  description: string;
  actionLabel: string;
  subject: RbacSubject;
}

type IVariantInputs = NonNullable<Partial<SubjectMeDeleteProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-delete";
}

export interface IComponentPropsExtended extends IComponentProps {}
