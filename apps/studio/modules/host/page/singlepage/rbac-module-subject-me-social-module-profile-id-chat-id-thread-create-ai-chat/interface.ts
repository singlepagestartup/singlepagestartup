import type { IProfilePageProps as IWorkspacePageProps } from "../rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";

export const variant =
  "rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat";

export interface IThreadCreatePageProps {
  variant?: "rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat";
  state?: IWorkspacePageProps["state"];
  errorMessage?: string;
  onRetry?: () => void;
  profileId: string;
  chatId: string;
}

type IVariantInputs = NonNullable<IThreadCreatePageProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-social-module-profile-id-chat-id-thread-create-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
