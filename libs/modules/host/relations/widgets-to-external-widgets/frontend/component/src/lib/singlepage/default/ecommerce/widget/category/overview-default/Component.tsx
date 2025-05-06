import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import { Component as RbacSubject } from "../../../../rbac/subject/me/ecommerce-product-action/Component";
import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { Component as EcommerceModuleCategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import { Component as EcommerceModuleStoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as EcommerceModuleCategory } from "@sps/ecommerce/models/category/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    url: string;
    language: string;
  },
) {
  return (
    <HostModulePage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="ecommerce.categories.id"
      url={props.url}
    >
      {({ data }) => {
        if (!data) {
          return;
        }

        return (
          <EcommerceModuleCategory
            isServer={props.isServer}
            variant="overview-default"
            data={{
              id: data,
            }}
            language={props.language}
          >
            <div className="grid lg:grid-cols-2 gap-4">
              <EcommerceModuleCategoriesToProducts
                isServer={props.isServer}
                variant="find"
                apiProps={{
                  params: {
                    filters: {
                      and: [
                        {
                          column: "categoryId",
                          method: "eq",
                          value: data,
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data }) => {
                  return data?.map((entity, index) => {
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
                                  value: entity.productId,
                                },
                              ],
                            },
                          },
                        }}
                      >
                        {({ data: products }) => {
                          if (!products) {
                            return;
                          }

                          return products.map((product, index) => {
                            return (
                              <EcommerceModuleProduct
                                key={index}
                                isServer={props.isServer}
                                variant="default"
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
                                                      value:
                                                        storeToProduct.storeId,
                                                    },
                                                  ],
                                                },
                                              },
                                            }}
                                          >
                                            {({ data: stores }) => {
                                              return stores?.map(
                                                (store, index) => {
                                                  return (
                                                    <RbacSubject
                                                      key={index}
                                                      isServer={props.isServer}
                                                      product={product}
                                                      store={store}
                                                      language={props.language}
                                                      variant="me-ecommerce-product-action"
                                                    />
                                                  );
                                                },
                                              );
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
                  });
                }}
              </EcommerceModuleCategoriesToProducts>
            </div>
          </EcommerceModuleCategory>
        );
      }}
    </HostModulePage>
  );
}
