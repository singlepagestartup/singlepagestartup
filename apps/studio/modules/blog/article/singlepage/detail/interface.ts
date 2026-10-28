import type { ReactNode } from "react";

export const variant = "detail";

export interface BlogCommentData {
  id: string;
  author: string;
  avatar: string;
  date: string;
  text: string;
  likes: number;
  replies?: BlogCommentData[];
}

export interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
}

export interface PinnedProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  price: string;
  priceLabel: string;
  category: string;
}

export type ArticleDetailProps = {
  slug: string;
  category: string;
  tags: string[];
  title: string;
  authorName: string;
  authorSlug: string;
  authorRole: string;
  authorAvatar: string;
  date: string;
  createdAt?: string;
  excerpt?: string;
  categorySlug?: string;
  readTime: string;
  totalComments: number;
  content: string;
  pinnedProducts: PinnedProduct[];
  comments: BlogCommentData[];
  relatedArticles: RelatedArticle[];
} & {
  cover?: ReactNode;
  tagsCard?: ReactNode;
  widgets?: ReactNode;
  breadcrumb?: ReactNode;
  outline?: { id: string; title: string }[];
  contents?: ReactNode;
  navigation?: ReactNode;
  author?: ReactNode;
  authorCard?: ReactNode;
  commentsContent?: ReactNode;
};

type IVariantInputs = NonNullable<
  Partial<ArticleDetailProps> & { variant?: "detail" }
>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "detail";
}

export interface IComponentPropsExtended extends ArticleDetailProps {
  variant?: "detail";
}
