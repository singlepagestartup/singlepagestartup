import type { ReactNode } from "react";

export const variant = "content-definition-grid" as const;

export interface IContentDefinitionItem {
  id: string;
  title: string;
  description: string;
  label?: string;
  href?: string;
  target?: "_self" | "_top" | "_blank";
  linkLabel?: string;
  sourceHref?: string;
  sourceLabel?: string;
}

export interface IComponentProps {
  variant?: typeof variant;
  id?: string;
  /** Grid utilities from the saved Widget presentation className. */
  className?: string;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  headingLevel?: "h1" | "h2";
  items?: IContentDefinitionItem[];
  children?: ReactNode;
  appearance?: "ruled" | "cards";
  columns?: 2 | 3 | 4;
  actions?: ReactNode;
  footer?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
