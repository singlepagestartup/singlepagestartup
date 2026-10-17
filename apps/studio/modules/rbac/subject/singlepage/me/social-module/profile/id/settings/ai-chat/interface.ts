import type {
  RbacAccountProfile,
  RbacAccountUser,
} from "../../../../../../../../shared";

export const variant = "me-social-module-profile-id-settings-ai-chat";

export interface SubjectMeProfileInformationProps {
  profileId?: string;
  subjectId?: string;
  variant?: "me-social-module-profile-id-settings-ai-chat";
  user: RbacAccountUser;
  title: string;
  bio: string;
  saveLabel: string;
  profile: RbacAccountProfile;
  profiles: RbacAccountProfile[];
  description: string;
  saveError?: string;
}

type IVariantInputs = NonNullable<Partial<SubjectMeProfileInformationProps>>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "me-social-module-profile-id-settings-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
