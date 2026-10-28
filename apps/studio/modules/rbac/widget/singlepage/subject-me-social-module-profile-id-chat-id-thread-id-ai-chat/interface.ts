export const variant =
  "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";

export interface ISubjectThreadWorkspaceProps {
  variant?: "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";
  state?:
    | "ready"
    | IWorkspaceSkeletonProps["stage"]
    | IWorkspaceNoticeProps["state"];
  errorMessage?: string;
  onRetry?: () => void;
  subjectId?: string;
  embedded?: boolean;
  profileId: string;
  chatId: string;
  threadId?: string;
}

type IVariantInputs = NonNullable<ISubjectThreadWorkspaceProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}

export interface IWorkspaceSkeletonProps {
  variant?:
    | "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat"
    | "subject-me-social-module-profile-id-chat-id-thread-create-ai-chat"
    | "subject-me-social-module-profile-id-settings-ai-chat";
  stage?: "checking-session" | "loading-projects" | "loading-chat";
  embedded?: boolean;
}

export interface IWorkspaceNoticeProps {
  variant?:
    | "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat"
    | "subject-me-social-module-profile-id-chat-id-thread-create-ai-chat"
    | "subject-me-social-module-profile-id-settings-ai-chat"
    | "subject-me-social-module-profile-list-ai-chat";
  embedded?: boolean;
  state: "sign-in-required" | "access-denied" | "error";
  message?: string;
  signInHref?: string;
  projectsHref?: string;
  onRetry?: () => void;
}
