import type { ReactNode } from "react";
export const variant = "card";
export interface CategoryCardProps {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  subtitleContent?: ReactNode;
  image?: string;
  imageAlt?: string;
  href?: string;
  target?: "_self" | "_top" | "_blank";
  count?: number;
  children?: ReactNode;
  layout?: "balanced" | "compact";
}
export interface IComponentProps extends Partial<CategoryCardProps> {
  variant?: "card";
}
export interface IComponentPropsExtended extends IComponentProps {}
