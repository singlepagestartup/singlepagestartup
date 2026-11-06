export const variant = "me-social-module-profile-select-ai-chat";

export interface ISubjectProfileSelectProps {
  variant?: "me-social-module-profile-select-ai-chat";
  subjectId?: string;
  profileId?: string;
  pending?: boolean;
  onNavigate?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}

type IVariantInputs = NonNullable<ISubjectProfileSelectProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-social-module-profile-select-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
