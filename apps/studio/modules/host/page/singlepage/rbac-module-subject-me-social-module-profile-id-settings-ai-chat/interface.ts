import type { IProfilePageProps as IWorkspacePageProps } from "../rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";

export const variant =
  "rbac-module-subject-me-social-module-profile-id-settings-ai-chat";

export interface IProfilePageProps {
  variant?: "rbac-module-subject-me-social-module-profile-id-settings-ai-chat";
  state?: IWorkspacePageProps["state"];
  errorMessage?: string;
  onRetry?: () => void;
  profileId: string;
}

type IVariantInputs = NonNullable<IProfilePageProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-social-module-profile-id-settings-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
