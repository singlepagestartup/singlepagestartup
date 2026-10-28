import type { TRenderAuthor } from "@sps/blog/models/article/frontend/component";
import type { ReactNode } from "react";
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
  language: string;
  renderAuthor?: TRenderAuthor;
  renderAuthorCard?: TRenderAuthor;
  renderCommentsContent?: (props: { data: IArticle }) => ReactNode;
  renderNavigation?: (props: { data: IArticle }) => ReactNode;
  articleSlug?: string;
  renderContent?: (props: { data: IArticle }) => ReactNode;
  renderPrivateContent?: (props: { data: IArticle }) => ReactNode;
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
  renderAuthorCard?: TRenderAuthor;
  renderCommentsContent?: IComponentProps["renderCommentsContent"];
  renderNavigation?: IComponentProps["renderNavigation"];
  articleSlug?: string;
  renderContent?: (props: { data: IArticle }) => ReactNode;
  renderPrivateContent?: IComponentProps["renderPrivateContent"];
}
