import type { ReactNode } from "react";
import type { CategoryButtonDefaultProps } from "../../../category/index";

export const variant = "article-find-card-default";

export interface ArticleFindCardDefaultArticle {
  href?: string;
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  excerptContent?: ReactNode;
  media?: { id: string; src: string; alt: string }[];
  coverImage: string;
  category: string;
  categorySlug?: string;
  date: string;
  createdAt?: string;
  content?: string;
  readTime: string;
  commentCount: number;
  authorName: string;
  authorSlug: string;
  authorAvatar: string;
}

export type ArticleFindCardDefaultProps = {
  embedded?: boolean;
  title?: string;
  description?: ReactNode;
  categories: BlogCategoryTab[];
  articles: ArticleFindCardDefaultArticle[];
  pageSize?: number;
};

type IVariantInputs = NonNullable<
  Partial<ArticleFindCardDefaultProps> & {
    variant?: "article-find-card-default";
  }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "article-find-card-default";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type BlogCategoryTab = Pick<
  CategoryButtonDefaultProps,
  "slug" | "label" | "count"
>;
