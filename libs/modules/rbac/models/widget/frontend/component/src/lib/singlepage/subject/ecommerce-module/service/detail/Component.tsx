import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { ServicePaymentTiming } from "@sps/website-builder/models/widget/frontend/component";
import { ServiceFrame } from "../ServiceFrame";
import { ServiceOffers } from "../ServiceOffers";
import { ServicePrice } from "../ServicePrice";
import { Component as Booking } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component({
  data,
  isServer,
  language,
  ecommerceModuleProductSlug,
}: IComponentPropsExtended) {
  if (!ecommerceModuleProductSlug) {
    return (
      <ServiceFrame widget={data} isServer={isServer} language={language} />
    );
  }
  return (
    <ServiceOffers
      isServer={isServer}
      ecommerceModuleProductSlug={ecommerceModuleProductSlug}
    >
      {([entry], store) => {
        if (!entry || !store) {
          return (
            <ServiceFrame
              widget={data}
              isServer={isServer}
              language={language}
            />
          );
        }
        const { product, offer } = entry;
        return (
          <ServiceFrame
            widget={data}
            isServer={isServer}
            language={language}
            slots={{
              heading:
                product.title?.[language] || product.title?.en || product.slug,
              summary:
                product.shortDescription?.[language] ||
                product.shortDescription?.en,
              description:
                product.description?.[language] || product.description?.en,
              media: (
                <EcommerceModuleProduct
                  isServer={isServer}
                  variant="gallery"
                  dataSource="props"
                  data={product}
                  language={language}
                />
              ),
              price: (
                <ServicePrice
                  ecommerceModuleProduct={product}
                  ecommerceModuleOffer={offer}
                  language={language}
                />
              ),
              note: (
                <ServicePaymentTiming
                  language={language}
                  workMetered={Boolean(offer.settings?.workTokenPricing)}
                  afterAcceptance={
                    offer.settings.requiresResultAcceptance === true
                  }
                />
              ),
            }}
          >
            <Booking
              language={language}
              ecommerceModuleProduct={product}
              ecommerceModuleStore={store}
              ecommerceModuleOfferId={offer.id}
            />
          </ServiceFrame>
        );
      }}
    </ServiceOffers>
  );
}
