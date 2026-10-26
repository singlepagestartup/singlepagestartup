import type { ReactNode } from "react";
export const variant = "card";

export type ArticleCardProps = {
  href: string | undefined;
  slug: string;
  coverImage: string;
  category: string;
  date: string;
  createdAt?: string;
  title: string;
  excerpt: string;
  excerptContent?: ReactNode;
  actionLabel?: string;
  media?: { id: string; src: string; alt: string }[];
  authorName: string;
  authorAvatar: string;
  authorSlug: string;
  author?: ReactNode;
  commentCount: number;
  readTime: string;
  target: ArticleCardTarget | undefined;
} & {
  /** Presentation choice only; the article record contract stays unchanged. */
  layout?: "balanced" | "editorial" | "compact" | "module" | "guide";
};

export interface IArticlePreview extends ArticleCardProps {
  id: string;
  categorySlug: string;
  content: string;
  authorRole: string;
  outline: { id: string; title: string }[];
}

type IVariantInputs = NonNullable<
  Partial<ArticleCardProps> & { variant?: "card" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "card";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type ArticleCardTarget = "_blank" | "_parent" | "_self" | "_top";
