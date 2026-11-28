import type { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as IEcommerceModuleOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { ICustomerWorkOfferScope } from "@sps/rbac/models/subject/sdk/model";

export interface IServicePriceProps {
  ecommerceModuleProduct: IEcommerceModuleProduct;
  ecommerceModuleOffer: IEcommerceModuleOffer;
  language: string;
}

export interface IServiceTokenPriceProps {
  ecommerceModuleProductId: ICustomerWorkOfferScope["productId"];
  ecommerceModuleStoreId: ICustomerWorkOfferScope["storeId"];
  ecommerceModuleOfferId: ICustomerWorkOfferScope["offerId"];
  language: string;
}
