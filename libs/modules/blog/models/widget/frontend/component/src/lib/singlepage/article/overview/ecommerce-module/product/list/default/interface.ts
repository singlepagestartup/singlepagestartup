import type { ReactNode } from "react";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
export { type IModel } from "@sps/blog/models/widget/sdk/model";
import { IModel } from "@sps/blog/models/widget/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant =
  "article-overview-ecommerce-module-product-list-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  language: string;
  articleSlug?: string;
  renderProduct?: (props: { data: IProduct }) => ReactNode;
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
  articleSlug?: string;
  renderProduct?: IComponentProps["renderProduct"];
}
