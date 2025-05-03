import { Component as EcommerceProduct } from "@sps/ecommerce/models/product/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { Component as WidgetsToStores } from "@sps/ecommerce/relations/widgets-to-stores/frontend/component";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";
import { Component as Product } from "../../../../../product/Component";

export function Component(
  props: ISpsComponentBase & {
    language: string;
    data: IModel;
    url: string;
    variant: string;
  },
) {
  return (
    <BillingCurrency
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "isDefault",
                method: "eq",
                value: true,
              },
            ],
          },
        },
      }}
    >
      {({ data: currencies }) => {
        return (
          <WidgetsToStores
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "widgetId",
                      method: "eq",
                      value: props.data.id,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((entity, index) => {
                return (
                  <Store
                    isServer={props.isServer}
                    key={index}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "id",
                              method: "eq",
                              value: entity.storeId,
                            },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: stores }) => {
                      return stores?.map((store, index) => {
                        return (
                          <StoresToProducts
                            key={index}
                            isServer={props.isServer}
                            variant="find"
                            apiProps={{
                              params: {
                                filters: {
                                  and: [
                                    {
                                      column: "storeId",
                                      method: "eq",
                                      value: store.id,
                                    },
                                  ],
                                },
                              },
                            }}
                          >
                            {({ data: storesToProducts }) => {
                              return (
                                <EcommerceProduct
                                  isServer={props.isServer}
                                  variant="find"
                                >
                                  {({ data }) => {
                                    return (
                                      <div className="grid lg:grid-cols-2 gap-4">
                                        {data?.map((product, index) => {
                                          if (
                                            !storesToProducts?.some(
                                              (storeToProduct) =>
                                                storeToProduct.productId ===
                                                product.id,
                                            )
                                          ) {
                                            return null;
                                          }

                                          return (
                                            <Product
                                              key={index}
                                              isServer={props.isServer}
                                              variant="card-default"
                                              data={product}
                                              language={props.language}
                                              billingModuleCurrencyId={
                                                currencies?.[0]?.id
                                              }
                                            />
                                          );
                                        })}
                                      </div>
                                    );
                                  }}
                                </EcommerceProduct>
                              );
                            }}
                          </StoresToProducts>
                        );
                      });
                    }}
                  </Store>
                );
              });
            }}
          </WidgetsToStores>
        );
      }}
    </BillingCurrency>
  );
}
