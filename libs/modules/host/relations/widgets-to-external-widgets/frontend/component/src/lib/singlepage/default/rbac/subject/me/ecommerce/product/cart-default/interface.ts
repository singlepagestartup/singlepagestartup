import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel as IEcommerceProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceStore } from "@sps/ecommerce/models/store/sdk/model";

export type IComponentProps = ISpsComponentBase & {
  product: IEcommerceProduct;
  store?: IEcommerceStore;
  language: string;
  variant: "me-ecommerce-product-cart-default";
};
