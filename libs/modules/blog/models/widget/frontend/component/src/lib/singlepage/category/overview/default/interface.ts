import type { TRenderAuthor } from "@sps/blog/models/article/frontend/component";
export { type IModel } from "@sps/blog/models/widget/sdk/model";
import { IModel } from "@sps/blog/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "category-overview-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
  renderAuthor?: TRenderAuthor;
  categorySlug?: string;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

export interface IContentProps {
  isServer: boolean;
  language: string;
  renderAuthor?: TRenderAuthor;
  categorySlug?: string;
}
