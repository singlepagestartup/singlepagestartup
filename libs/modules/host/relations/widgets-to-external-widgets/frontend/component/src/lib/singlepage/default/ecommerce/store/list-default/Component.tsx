import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductAction } from "../../product/action/Component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: ISpsComponentBase) {
  return (
    <Store isServer={props.isServer} variant="find">
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <Store
              key={index}
              isServer={props.isServer}
              variant="default"
              data={entity}
            >
              <StoresToProducts
                isServer={props.isServer}
                variant="find"
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "storeId",
                          method: "eq",
                          value: entity.id,
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data }) => {
                  return data?.map((storeToProduct, index) => {
                    return (
                      <Product
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
                                  value: storeToProduct.productId,
                                },
                              ],
                            },
                          },
                        }}
                      >
                        {({ data }) => {
                          return data?.map((product, index) => {
                            return (
                              <Product
                                key={index}
                                isServer={props.isServer}
                                variant="default"
                                data={product}
                              >
                                <ProductAction
                                  isServer={props.isServer}
                                  product={product}
                                />
                              </Product>
                            );
                          });
                        }}
                      </Product>
                    );
                  });
                }}
              </StoresToProducts>
            </Store>
          );
        });
      }}
    </Store>
  );
}
