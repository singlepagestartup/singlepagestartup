import type { ReactNode } from "react";

export const variant = "content-collection" as const;

export interface IComponentProps {
  variant?: typeof variant;
  id?: string;
  eyebrow?: string;
  title?: string;
  headingLevel?: "h1" | "h2";
  description?: ReactNode;
  spacing?: "default" | "page";
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
