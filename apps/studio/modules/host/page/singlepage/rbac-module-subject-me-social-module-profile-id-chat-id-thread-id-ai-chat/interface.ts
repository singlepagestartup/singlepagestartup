export const variant =
  "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";

export interface IProfilePageProps {
  variant?: "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";
  profileId: string;
  state?:
    | "ready"
    | "checking-session"
    | "loading-projects"
    | "loading-chat"
    | "sign-in-required"
    | "access-denied"
    | "error";
  errorMessage?: string;
  onRetry?: () => void;
}

type IVariantInputs = NonNullable<IProfilePageProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "rbac-module-subject-me-social-module-profile-id-chat-id-thread-id-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
