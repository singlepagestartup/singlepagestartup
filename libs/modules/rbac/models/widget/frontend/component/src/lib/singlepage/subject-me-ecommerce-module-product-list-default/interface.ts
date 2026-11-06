import type { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel } from "@sps/rbac/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant =
  "subject-me-ecommerce-module-product-list-default" as const;
export interface IComponentProps extends IParent<IModel, typeof variant> {
  language?: string;
}
export interface IComponentPropsExtended
  extends IParentExtended<IModel, typeof variant, IComponentProps> {}

export interface IProductRowProps {
  ecommerceModuleProduct: IEcommerceModuleProduct;
  language: string;
}

export interface IContentProps {
  widgetId: string;
  isServer: boolean;
  language: string;
}
