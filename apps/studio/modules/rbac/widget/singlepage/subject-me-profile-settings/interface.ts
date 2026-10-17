import type { IAIChatServicePageContent } from "../../../../website-builder/widget/singlepage/content/ai-chat/content";

export const variant = "subject-me-profile-settings";

export interface SubjectMeProfileSettingsProps {
  variant?: "subject-me-profile-settings";
  copy?: IAIChatServicePageContent;
  showTokens?: boolean;
  initialSection?: "profile" | "sign-in" | "purchases" | "data";
  profileId?: string;
}

type IVariantInputs = NonNullable<SubjectMeProfileSettingsProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "subject-me-profile-settings";
}

export interface IComponentPropsExtended extends IComponentProps {}
