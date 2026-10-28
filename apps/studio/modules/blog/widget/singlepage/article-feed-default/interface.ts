import type { ReactNode } from "react";
export const variant = "article-feed-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  empty?: boolean;
  loading?: boolean;
}
export interface IComponentPropsExtended extends IComponentProps {}
