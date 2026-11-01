import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel as IBlogModuleArticle } from "@sps/blog/models/article/sdk/model";
export const variant =
  "me-blog-module-article-private-content-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  blogModuleArticle: IBlogModuleArticle;
  language: string;
}
export interface IComponentPropsExtended extends IComponentProps {}
