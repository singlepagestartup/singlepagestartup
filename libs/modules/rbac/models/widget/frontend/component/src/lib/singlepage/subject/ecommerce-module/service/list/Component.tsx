import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import { ServiceCard } from "@sps/website-builder/models/widget/frontend/component";
import { ServiceFrame } from "../ServiceFrame";
import { ServiceOffers } from "../ServiceOffers";
import type { IComponentPropsExtended } from "./interface";

export function Component({
  data,
  isServer,
  language,
}: IComponentPropsExtended) {
  return (
    <ServiceOffers isServer={isServer}>
      {(entries) => (
        <ServiceFrame widget={data} isServer={isServer} language={language}>
          {entries.length
            ? entries.map(({ product, offer }) => (
                <ServiceCard
                  key={product.id}
                  title={
                    product.title?.[language] ||
                    product.title?.en ||
                    product.slug
                  }
                  summary={
                    product.shortDescription?.[language] ||
                    product.shortDescription?.en
                  }
                  href={`/${language}/framework/services/${encodeURIComponent(product.slug)}`}
                  language={language}
                  price={
                    <EcommerceModuleStore
                      isServer={false}
                      variant="product-price-default"
                      product={product}
                      storeId={offer.storeId}
                      offerId={offer.id}
                      language={language}
                      readOnly
                    />
                  }
                />
              ))
            : undefined}
        </ServiceFrame>
      )}
    </ServiceOffers>
  );
}
