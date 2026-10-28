export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import {
  IComponentProps as IParentComponentProps,
  IComponentPropsExtended as IParentComponentPropsExtended,
} from "@sps/shared-frontend-components/singlepage/subject-default/interface";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";

export const variant = "ecommerce-module-product-checkout-default" as const;

export interface IComponentProps
  extends IParentComponentProps<IModel, typeof variant> {
  ecommerceModuleProduct: IEcommerceModuleProduct;
  language: string;
  ecommerceModuleStore?: IEcommerceModuleStore;
}

export interface IComponentPropsExtended
  extends IParentComponentPropsExtended<
    IModel,
    typeof variant,
    IComponentProps
  > {}

export interface ICheckoutFields {
  provider: string;
  email: string;
  quantity: number;
  comment?: string;
  storeId?: string;
  billingModule: { currency: { id?: string } };
}
export interface ICheckoutPriceProps {
  form: import("react-hook-form").UseFormReturn<ICheckoutFields>;
  product: IEcommerceModuleProduct;
  language: string;
}
