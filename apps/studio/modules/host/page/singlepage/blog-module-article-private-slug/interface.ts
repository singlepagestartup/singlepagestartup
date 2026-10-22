import type { ArticleContentAccess } from "../../../../blog/article";
export const variant = "blog-module-article-private-slug";
export interface IComponentProps {
  variant?: "blog-module-article-private-slug";
  access?: ArticleContentAccess;
}
export interface IComponentPropsExtended extends IComponentProps {}
