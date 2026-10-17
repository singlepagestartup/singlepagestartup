import type { IResult } from "@sps/rbac/models/subject/sdk/server";
import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import type { ReactNode } from "react";
import type {
  IModel,
  IAIChatProject,
} from "@sps/rbac/models/subject/sdk/model";
import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant = "me-social-module-profile-list-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  initialProjects?: IAIChatProject[];
  loading?: ReactNode;
  renderError?: (props: { retry: () => void }) => ReactNode;
  renderProjects: (props: { projects: IAIChatProject[] }) => ReactNode;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {
  /** Loaded with socialModuleProfileFind and socialModuleProfileProjects. */
  loadedProjects?: IResult["ISocialModuleProfileProjectsResult"];
  projectsLoading: boolean;
  projectsError?: string;
  retryProjects?: () => void;
}
export interface ILoadErrorProps {
  error: string;
  onRetry?: () => void;
}
