import type {
  ArticleContentAccess,
  ArticleOverviewDefaultProps,
} from "../../../article";
export const variant = "article-overview-with-private-content-default";
export interface IComponentProps {
  variant?: "article-overview-with-private-content-default";
  access?: ArticleContentAccess;
  article?: Partial<ArticleOverviewDefaultProps>;
}
export interface IComponentPropsExtended extends IComponentProps {}
