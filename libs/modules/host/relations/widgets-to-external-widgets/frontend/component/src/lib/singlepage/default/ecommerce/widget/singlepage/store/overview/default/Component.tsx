import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import { Component as EcommerceModuleStoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as EcommerceProduct } from "../../../../../product";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <HostModulePage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="ecommerce.stores.slug"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <EcommerceModuleStore
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "slug",
                      method: "eq",
                      value: data,
                    },
                  ],
                },
              },
            }}
          >
            {({ data: stores }) => {
              return stores?.map((store, index) => {
                return (
                  <EcommerceModuleStore
                    key={index}
                    isServer={props.isServer}
                    variant="overview-default"
                    data={store}
                    language={props.language}
                  >
                    <EcommerceModuleStoresToProducts
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
                          <div className="grid lg:grid-cols-2 gap-4">
                            {storesToProducts?.map((storeToProduct, index) => {
                              return (
                                <EcommerceModuleProduct
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
                                  {({ data: products }) => {
                                    return products?.map((product, index) => {
                                      return (
                                        <EcommerceProduct
                                          key={index}
                                          isServer={props.isServer}
                                          variant={product.variant as any}
                                          data={product}
                                          language={props.language}
                                        />
                                      );
                                    });
                                  }}
                                </EcommerceModuleProduct>
                              );
                            })}
                          </div>
                        );
                      }}
                    </EcommerceModuleStoresToProducts>
                  </EcommerceModuleStore>
                );
              });
            }}
          </EcommerceModuleStore>
        );
      }}
    </HostModulePage>
  );
}
