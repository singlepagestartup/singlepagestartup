import type { ReactNode } from "react";

export const variant = "content-collection" as const;

export interface IComponentProps {
  variant?: typeof variant;
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
