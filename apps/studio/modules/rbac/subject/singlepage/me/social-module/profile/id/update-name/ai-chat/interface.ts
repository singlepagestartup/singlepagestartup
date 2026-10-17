export const variant = "me-social-module-profile-id-update-name-ai-chat";

export interface ISubjectProfileNameProps {
  variant?: "me-social-module-profile-id-update-name-ai-chat";
  profileId: string;
  subjectId?: string;
}

type IVariantInputs = NonNullable<ISubjectProfileNameProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-social-module-profile-id-update-name-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
