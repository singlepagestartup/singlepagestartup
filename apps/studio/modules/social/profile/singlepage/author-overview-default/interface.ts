import type { ReactNode } from "react";
export const variant = "author-overview-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  id?: string;
  name?: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  articleCount?: number;
  productCount?: number;
  language?: string;
  children?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
