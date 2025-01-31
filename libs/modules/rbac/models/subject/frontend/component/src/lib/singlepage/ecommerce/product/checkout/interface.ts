export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";

export const variant = "ecommerce-product-checkout" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  product: IProduct;
  billingModuleCurrencyId?: string;
  language: string;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {
  product: IProduct;
}
