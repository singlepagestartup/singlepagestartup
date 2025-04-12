export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";

export const variant = "ecommerce-product-cart" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  product: IProduct;
  store: IStore;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}
