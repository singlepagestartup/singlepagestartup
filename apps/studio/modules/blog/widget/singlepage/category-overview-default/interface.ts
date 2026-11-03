import type { ReactNode } from "react";
import type { CategoryOverviewProps } from "../../../category";
import type { ArticleFindCardDefaultArticle } from "../article-find-card-default/interface";
export const variant = "category-overview-default";
export interface IComponentProps {
  variant?: "category-overview-default";
  category?: CategoryOverviewProps;
  articles?: ArticleFindCardDefaultArticle[];
  description?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
