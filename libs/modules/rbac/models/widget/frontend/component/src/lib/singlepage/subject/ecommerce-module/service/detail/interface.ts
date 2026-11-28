import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import type { IModel as IOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";

import type { IModel } from "@sps/rbac/models/widget/sdk/model";
import type {
  IComponentProps as IParent,
  IComponentPropsExtended as IParentExtended,
} from "@sps/shared-frontend-components/singlepage/default/interface";

export const variant = "framework-service-detail" as const;

export interface IComponentProps extends IParent<IModel, typeof variant> {
  language: string;
  ecommerceModuleProductSlug?: string;
}

export interface IComponentPropsExtended extends IParentExtended<
  IModel,
  typeof variant,
  IComponentProps
> {}

export interface IBookingProps {
  language: string;
  ecommerceModuleProduct: IProduct;
  ecommerceModuleStore: IStore;
  ecommerceModuleOfferId: IOffer["id"];
}
