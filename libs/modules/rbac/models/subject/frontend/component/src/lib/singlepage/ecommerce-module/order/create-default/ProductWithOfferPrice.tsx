import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { OfferPrice, OfferPriceProvider } from "./OfferPrice";
import type { IProductWithOfferPriceProps } from "./interface";

export function ProductWithOfferPrice(props: IProductWithOfferPriceProps) {
  return (
    <OfferPriceProvider key={`${props.product.id}:${props.storeId ?? ""}`}>
      <Product
        variant={props.variant}
        isServer={props.isServer}
        language={props.language}
        dataSource="props"
        data={props.product}
        topSlot={props.topSlot}
        middleSlot={props.middleSlot}
        priceSlot={
          <OfferPrice
            product={props.product}
            storeId={props.storeId}
            language={props.language}
          >
            <Store
              isServer={props.isServer}
              variant="product-price-default"
              product={props.product}
              storeId={props.storeId}
              language={props.language}
              readOnly
            />
          </OfferPrice>
        }
      >
        {props.children}
      </Product>
    </OfferPriceProvider>
  );
}
