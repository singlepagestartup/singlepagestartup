import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel as IBlogModuleArticle } from "@sps/blog/models/article/sdk/model";
import type { IModel } from "@sps/rbac/models/subject/sdk/model";
import type { IProps, IResult } from "@sps/rbac/models/subject/sdk/client";
export const variant =
  "me-blog-module-article-private-content-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  blogModuleArticle: IBlogModuleArticle;
  language: string;
  /** The client reader runs authenticationMe, then the Subject-scoped operation. */
  apiProps?: Partial<IProps["IBlogModuleArticleFindByIdContentFindProps"]>;
}
export interface IComponentPropsExtended extends IComponentProps {
  data: IModel;
  queryScopePrefix: string;
  content?: IResult["IBlogModuleArticleFindByIdContentFindResult"];
  state: "checking" | "error" | "expired" | "ready";
  onRetry: () => void;
}

export interface IClientComponentProps
  extends Pick<
    IComponentPropsExtended,
    | "blogModuleArticle"
    | "language"
    | "content"
    | "state"
    | "onRetry"
    | "queryScopePrefix"
  > {}
