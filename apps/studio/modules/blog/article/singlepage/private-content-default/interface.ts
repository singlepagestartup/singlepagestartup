import type { ReactNode } from "react";
export const variant = "private-content-default";
export type ArticleContentAccess =
  | "guest"
  | "locked"
  | "expired"
  | "granted"
  | "checking"
  | "error";
export interface IComponentProps {
  variant?: "private-content-default";
  access?: ArticleContentAccess;
  title?: string;
  description?: string;
  actionHref?: string;
  actionTarget?: "_self" | "_top" | "_blank";
  actionLabel?: string;
  children?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
