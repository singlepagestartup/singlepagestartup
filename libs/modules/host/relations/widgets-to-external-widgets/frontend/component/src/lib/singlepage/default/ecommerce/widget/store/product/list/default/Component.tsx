import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import { Component as EcommerceModuleWidgetsToStores } from "@sps/ecommerce/relations/widgets-to-stores/frontend/component";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as EcommerceModuleStoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as BillingModuleCurrency } from "@sps/billing/models/currency/frontend/component";
import { Component as EcommerceProduct } from "../../../../../product/Component";

export function Component(
  props: ISpsComponentBase & {
    language: string;
    data: IModel;
    url: string;
    variant: string;
  },
) {
  return (
    <BillingModuleCurrency
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
          <EcommerceModuleWidgetsToStores
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
                  <EcommerceModuleStore
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
                          <EcommerceModuleStoresToProducts
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
                                <EcommerceModuleProduct
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
                                            <EcommerceProduct
                                              key={index}
                                              isServer={props.isServer}
                                              variant={product.variant as any}
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
                                </EcommerceModuleProduct>
                              );
                            }}
                          </EcommerceModuleStoresToProducts>
                        );
                      });
                    }}
                  </EcommerceModuleStore>
                );
              });
            }}
          </EcommerceModuleWidgetsToStores>
        );
      }}
    </BillingModuleCurrency>
  );
}
