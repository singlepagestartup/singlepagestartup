export const variant = "me-social-module-profile-create-ai-chat";

export interface ISubjectProfileCreateProps {
  variant?: "me-social-module-profile-create-ai-chat";
  subjectId?: string;
  pending?: boolean;
  hideBackLink?: boolean;
}

type IVariantInputs = NonNullable<ISubjectProfileCreateProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-social-module-profile-create-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
