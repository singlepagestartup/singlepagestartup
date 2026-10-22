import type { ReactNode } from "react";
export const variant = "card";

export type ArticleCardProps = {
  href: string | undefined;
  slug: string;
  coverImage: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  excerptContent?: ReactNode;
  media?: { id: string; src: string; alt: string }[];
  authorName: string;
  authorAvatar: string;
  authorSlug: string;
  commentCount: number;
  readTime: string;
  target: ArticleCardTarget | undefined;
} & {
  /** Presentation choice only; the article record contract stays unchanged. */
  layout?: "balanced" | "editorial" | "compact";
};

type IVariantInputs = NonNullable<
  Partial<ArticleCardProps> & { variant?: "card" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "card";
}

export interface IComponentPropsExtended extends IComponentProps {}

export type ArticleCardTarget = "_blank" | "_parent" | "_self" | "_top";
