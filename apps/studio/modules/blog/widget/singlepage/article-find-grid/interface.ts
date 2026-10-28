import type { ReactNode } from "react";
import type { ArticleCardProps } from "../../../article";
export const variant = "article-find-grid" as const;
export interface IGridArticle
  extends Pick<
    ArticleCardProps,
    "title" | "excerpt" | "coverImage" | "slug" | "href"
  > {
  id: string;
  category?: string;
  target?: ArticleCardProps["target"];
}
export interface IComponentProps {
  variant?: typeof variant;
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  articles: IGridArticle[];
  cardLayout: "module" | "guide";
  articleActionLabel?: string;
}
export interface IComponentPropsExtended extends IComponentProps {}
