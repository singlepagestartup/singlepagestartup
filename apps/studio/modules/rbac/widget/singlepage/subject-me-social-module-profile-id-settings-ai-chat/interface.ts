import type { ISubjectThreadWorkspaceProps } from "../subject-me-social-module-profile-id-chat-id-thread-id-ai-chat/interface";

export const variant = "subject-me-social-module-profile-id-settings-ai-chat";

export interface ISubjectProfileSettingsProps {
  variant?: "subject-me-social-module-profile-id-settings-ai-chat";
  state?: ISubjectThreadWorkspaceProps["state"];
  errorMessage?: string;
  onRetry?: () => void;
  subjectId?: string;
  profileId: string;
}

type IVariantInputs = NonNullable<ISubjectProfileSettingsProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "subject-me-social-module-profile-id-settings-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
