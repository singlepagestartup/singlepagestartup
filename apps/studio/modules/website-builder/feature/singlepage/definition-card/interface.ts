import type { ReactNode } from "react";

export const variant = "definition-card" as const;

export interface IComponentProps {
  variant?: typeof variant;
  title: string;
  subtitle?: string;
  description: string;
  href?: string;
  target?: "_self" | "_top" | "_blank";
  linkLabel?: string;
  sourceHref?: string;
  sourceLabel?: string;
  appearance?: "ruled" | "cards" | "checklist";
  actions?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
