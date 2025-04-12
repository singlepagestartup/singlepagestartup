import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductAction } from "../../../product/action/Component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { Component as WidgetsToStores } from "@sps/ecommerce/relations/widgets-to-stores/frontend/component";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";

export function Component(
  props: ISpsComponentBase & {
    billingModuleCurrencyId?: string;
    language: string;
    data: IModel;
  },
) {
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
                          <Product isServer={props.isServer} variant="find">
                            {({ data }) => {
                              return (
                                <div className="grid lg:grid-cols-2 gap-4">
                                  {data?.map((entity, index) => {
                                    if (
                                      !storesToProducts?.some(
                                        (storeToProduct) =>
                                          storeToProduct.productId ===
                                          entity.id,
                                      )
                                    ) {
                                      return null;
                                    }

                                    return (
                                      <Product
                                        key={index}
                                        isServer={props.isServer}
                                        variant="card-default"
                                        data={entity}
                                        language={props.language}
                                      >
                                        <ProductAction
                                          isServer={props.isServer}
                                          product={entity}
                                          billingModuleCurrencyId={
                                            props.billingModuleCurrencyId
                                          }
                                          language={props.language}
                                          store={store}
                                        />
                                      </Product>
                                    );
                                  })}
                                </div>
                              );
                            }}
                          </Product>
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
}
