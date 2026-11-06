import type {
  ArticleContentAccess,
  BlogCommentData,
} from "../../../../blog/article";
export const variant = "blog-module-article-private-slug";
export interface IComponentProps {
  variant?: "blog-module-article-private-slug";
  access?: ArticleContentAccess;
  comments?: BlogCommentData[];
  totalComments?: number;
}
export interface IComponentPropsExtended extends IComponentProps {}
