import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import { ServiceTokenPrice } from "./client";
import type { IServicePriceProps } from "./interface";

export function ServicePrice({
  ecommerceModuleProduct,
  ecommerceModuleOffer,
  language,
}: IServicePriceProps) {
  if (ecommerceModuleOffer.settings?.workTokenPricing) {
    return (
      <ServiceTokenPrice
        ecommerceModuleOfferId={ecommerceModuleOffer.id}
        ecommerceModuleStoreId={ecommerceModuleOffer.storeId}
        ecommerceModuleProductId={ecommerceModuleProduct.id}
        language={language}
      />
    );
  }

  return (
    <EcommerceModuleStore
      isServer={false}
      variant="product-price-default"
      product={ecommerceModuleProduct}
      storeId={ecommerceModuleOffer.storeId}
      offerId={ecommerceModuleOffer.id}
      language={language}
      readOnly
    />
  );
}
