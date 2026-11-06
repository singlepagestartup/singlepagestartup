import type { BlogCommentData } from "../../../../blog/article";
export const variant = "blog-module-article-slug";

export interface IComponentVariantProps {
  variant?: "blog-module-article-slug";
  articleSlug?: string;
  comments?: BlogCommentData[];
  totalComments?: number;
}

type IVariantInputs = NonNullable<IComponentVariantProps>;

export interface IComponentProps extends Omit<IVariantInputs, "variant"> {
  variant?: "blog-module-article-slug";
}

export interface IComponentPropsExtended extends IComponentProps {}
