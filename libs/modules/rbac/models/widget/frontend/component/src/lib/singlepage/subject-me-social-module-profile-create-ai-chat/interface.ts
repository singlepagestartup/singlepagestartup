import type { ReactNode } from "react";
import type { IComponentPropsExtended as IParentExtended } from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel } from "@sps/rbac/models/widget/sdk/model";
import type { IComponentProps as IParent } from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant =
  "subject-me-social-module-profile-create-ai-chat" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IProjectSummary {
  id: string;
  name: string;
  href: string;
}
export interface IProjectsOverviewProps {
  variant?: typeof variant;
  projects: IProjectSummary[];
  pending?: boolean;
  error?: boolean;
  creating?: boolean;
  onCreate?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  children?: ReactNode;
}
