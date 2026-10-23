import type { ReactNode } from "react";
export const variant = "author-list-default" as const;
export interface IComponentProps {
  variant?: typeof variant;
  loading?: boolean;
  empty?: boolean;
  error?: boolean;
  noProducts?: boolean;
  children?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
