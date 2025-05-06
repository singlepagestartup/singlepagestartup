import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as RbacSubject } from "../../../../../rbac/subject/me/ecommerce-product-action/Component";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as EcommerceModuleStoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
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
    <HostModulePage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="ecommerce.products.slug"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <EcommerceModuleProduct
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
            {({ data: products }) => {
              return products?.map((product, index) => {
                return (
                  <EcommerceModuleProduct
                    key={index}
                    isServer={props.isServer}
                    variant="overview-default"
                    data={product}
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
                              <EcommerceModuleStore
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
                                        variant="me-ecommerce-product-action"
                                      />
                                    );
                                  });
                                }}
                              </EcommerceModuleStore>
                            );
                          },
                        );
                      }}
                    </EcommerceModuleStoresToProducts>
                  </EcommerceModuleProduct>
                );
              });
            }}
          </EcommerceModuleProduct>
        );
      }}
    </HostModulePage>
  );
}
