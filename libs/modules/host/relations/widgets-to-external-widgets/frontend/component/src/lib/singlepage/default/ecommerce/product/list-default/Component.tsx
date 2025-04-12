import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductAction } from "../action/Component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";

export function Component(
  props: ISpsComponentBase & {
    billingModuleCurrencyId?: string;
    language: string;
  },
) {
  return (
    <Product isServer={props.isServer} variant="find">
      {({ data: products }) => {
        return (
          <div className="grid lg:grid-cols-2 gap-4">
            {products?.map((product, index) => {
              return (
                <Product
                  key={index}
                  isServer={props.isServer}
                  variant="card-default"
                  data={product}
                  language={props.language}
                >
                  <StoresToProducts
                    isServer={props.isServer}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "productId",
                              method: "eq",
                              value: product.id,
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: storesToProducts }) => {
                      return storesToProducts?.map((storeToProduct, index) => {
                        return (
                          <Store
                            key={index}
                            isServer={props.isServer}
                            variant="find"
                            apiProps={{
                              params: {
                                filters: {
                                  and: [
                                    {
                                      column: "id",
                                      method: "eq",
                                      value: storeToProduct.storeId,
                                    },
                                  ],
                                },
                              },
                            }}
                          >
                            {({ data: stores }) => {
                              return stores?.map((store, index) => {
                                return (
                                  <ProductAction
                                    key={index}
                                    store={store}
                                    isServer={props.isServer}
                                    product={product}
                                    language={props.language}
                                  />
                                );
                              });
                            }}
                          </Store>
                        );
                      });
                    }}
                  </StoresToProducts>
                </Product>
              );
            })}
          </div>
        );
      }}
    </Product>
  );
}
