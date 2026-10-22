import type { ReactNode } from "react";
import type { CategoryCardProps } from "../../../category";
export const variant = "category-find-card";
export interface IComponentProps {
  variant?: "category-find-card";
  title?: string;
  description?: ReactNode;
  categories?: CategoryCardProps[];
  loading?: boolean;
}
export interface IComponentPropsExtended extends IComponentProps {}
