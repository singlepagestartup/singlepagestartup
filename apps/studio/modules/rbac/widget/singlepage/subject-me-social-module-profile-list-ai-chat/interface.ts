import type { ReactNode } from "react";

export const variant = "subject-me-social-module-profile-list-ai-chat";

export interface IProjectSummary {
  id: string;
  name: string;
  href: string;
}

export interface IProjectsOverviewProps {
  variant?: "subject-me-social-module-profile-list-ai-chat";
  state?: "ready" | "sign-in-required";
  projects: IProjectSummary[];
  pending?: boolean;
  error?: boolean;
  creating?: boolean;
  onCreate?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  children?: ReactNode;
}

type IVariantInputs = NonNullable<IProjectsOverviewProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "subject-me-social-module-profile-list-ai-chat";
}

export interface IComponentPropsExtended extends IComponentProps {}
