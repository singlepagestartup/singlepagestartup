import type {
  IComponentPropsExtended as IParentExtended,
  IComponentProps as IParent,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/rbac/models/widget/sdk/model";

export const variant =
  "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
  socialModuleProfileId?: string;
  socialModuleChatId?: string;
  socialModuleThreadId?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IWorkspaceNoticeProps {
  language?: string;
  embedded?: boolean;
  state: "sign-in-required" | "access-denied" | "error";
  message?: string;
  signInHref?: string;
  projectsHref?: string;
  onRetry?: () => void;
}

export interface IClientComponentProps extends IComponentPropsExtended {
  socialModuleProfileId?: string;
  socialModuleChatId?: string;
  socialModuleThreadId?: string;
}

export interface IWorkspaceSkeletonProps {
  language?: string;
  stage?: "checking-session" | "loading-projects" | "loading-chat";
  embedded?: boolean;
}
