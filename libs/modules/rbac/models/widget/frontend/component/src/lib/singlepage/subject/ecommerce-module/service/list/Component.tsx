import { ServiceCard } from "@sps/website-builder/models/widget/frontend/component";
import { ServiceFrame } from "../ServiceFrame";
import { ServiceOffers } from "../ServiceOffers";
import { ServicePrice } from "../ServicePrice";
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
                    <ServicePrice
                      ecommerceModuleProduct={product}
                      ecommerceModuleOffer={offer}
                      language={language}
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
