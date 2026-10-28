import type { ReactNode } from "react";
export const variant = "content-form" as const;
export interface IComponentProps {
  variant?: typeof variant;
  title?: string;
  description?: string;
  children?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
