export { type IModel } from "@sps/blog/models/widget/sdk/model";
import { IModel } from "@sps/blog/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";
import { IModel as IArticle } from "@sps/blog/models/article/sdk/model";

export const variant = "article-overview-with-private-content-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  id: IArticle["id"];
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
