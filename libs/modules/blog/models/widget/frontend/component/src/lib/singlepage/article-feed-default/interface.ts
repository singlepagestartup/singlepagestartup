import type { IModel } from "@sps/blog/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import type { IModel as IArticle } from "@sps/blog/models/article/sdk/model";
import type { TRenderAuthor } from "@sps/blog/models/article/frontend/component";
export const variant = "article-feed-default" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language: string;
  renderAuthor?: TRenderAuthor;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}
export interface IClientComponentProps
  extends Pick<
    IComponentPropsExtended,
    "data" | "language" | "variant" | "className" | "renderAuthor"
  > {
  entries: IArticle[];
  page: number;
  pages: number;
  total: number;
  fetching: boolean;
  failed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onRetry: () => void;
}
