import type { ReactNode } from "react";
export const variant = "overview-default";
export interface CategoryOverviewProps {
  title?: string;
  subtitle?: string;
  description?: ReactNode;
  media?: ReactNode;
  widgets?: ReactNode;
  children?: ReactNode;
  backHref?: string;
}
export interface IComponentProps extends CategoryOverviewProps {
  variant?: "overview-default";
}
export interface IComponentPropsExtended extends IComponentProps {}
