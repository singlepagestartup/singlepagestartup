import type { ReactNode } from "react";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import { Component as EcommerceModuleStoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import {
  selectRetailOffer,
  type IModel as IOffer,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";

interface IServiceOffer {
  product: IProduct;
  offer: IOffer;
}

interface IServiceOffersProps {
  isServer: boolean;
  ecommerceModuleProductSlug?: string;
  children: (entries: IServiceOffer[], store?: IStore) => ReactNode;
}

const frameworkStoreSlug = "framework-agent-services";

export function ServiceOffers({
  isServer,
  ecommerceModuleProductSlug,
  children,
}: IServiceOffersProps) {
  return (
    <EcommerceModuleStore
      isServer={isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "slug", method: "eq", value: frameworkStoreSlug },
              { column: "variant", method: "ne", value: "hidden" },
            ],
          },
        },
      }}
    >
      {({ data: stores }) => {
        const store = stores?.[0];
        if (!store) return children([]);
        return (
          <EcommerceModuleStoresToProducts
            isServer={isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    { column: "storeId", method: "eq", value: store.id },
                    { column: "variant", method: "eq", value: "default" },
                  ],
                },
                orderBy: {
                  and: [
                    { column: "orderIndex", method: "asc" },
                    { column: "id", method: "asc" },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              const offers =
                data?.filter(
                  (offer) =>
                    offer.settings?.standalone && !offer.settings.initialGrant,
                ) ?? [];
              const productIds = [
                ...new Set(offers.map((offer) => offer.productId)),
              ];
              if (!productIds.length) return children([]);
              return (
                <EcommerceModuleProduct
                  isServer={isServer}
                  variant="find"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "id",
                            method: "inArray",
                            value: productIds,
                          },
                          { column: "kind", method: "eq", value: "service" },
                          { column: "variant", method: "eq", value: "default" },
                          ...(ecommerceModuleProductSlug
                            ? [
                                {
                                  column: "slug",
                                  method: "eq",
                                  value: ecommerceModuleProductSlug,
                                },
                              ]
                            : []),
                        ],
                      },
                    },
                  }}
                >
                  {({ data: products }) => {
                    const byId = new Map(
                      products?.map((product) => [product.id, product]),
                    );
                    const entries = productIds.flatMap((id) => {
                      const product = byId.get(id);
                      if (!product) return [];
                      const offer = selectRetailOffer({
                        offers,
                        product,
                        storeId: store.id,
                      });
                      return offer ? [{ product, offer }] : [];
                    });
                    return children(entries, store);
                  }}
                </EcommerceModuleProduct>
              );
            }}
          </EcommerceModuleStoresToProducts>
        );
      }}
    </EcommerceModuleStore>
  );
}
