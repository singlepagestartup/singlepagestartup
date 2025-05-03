import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as RbacSubject } from "../../../../../rbac/subject/ecommerce-product-action/Component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
export function Component(
  props: ISpsComponentBase & {
    url: string;
    language: string;
    data: IModel;
    variant: string;
  },
) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-value"
      segment="ecommerce.products.id"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <Product
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "eq",
                      value: data,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: products }) => {
              return products?.map((product, index) => {
                return (
                  <Product
                    key={index}
                    isServer={props.isServer}
                    variant="overview-default"
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
                        return storesToProducts?.map(
                          (storeToProduct, index) => {
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
                                      <RbacSubject
                                        key={index}
                                        store={store}
                                        isServer={props.isServer}
                                        product={product}
                                        language={props.language}
                                        variant="ecommerce-product-action"
                                      />
                                    );
                                  });
                                }}
                              </Store>
                            );
                          },
                        );
                      }}
                    </StoresToProducts>
                  </Product>
                );
              });
            }}
          </Product>
        );
      }}
    </Page>
  );
}
