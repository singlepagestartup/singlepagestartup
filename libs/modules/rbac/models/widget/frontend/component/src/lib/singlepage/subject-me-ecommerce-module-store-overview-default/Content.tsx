import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import { Component as EcommerceModuleStoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  const data = props.ecommerceModuleStoreSlug;
  if (!data) return null;
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
        return stores?.map((store) => {
          return (
            <EcommerceModuleStore
              key={store.id}
              isServer={props.isServer}
              variant="overview-default"
              dataSource="props"
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
                      {storesToProducts?.map((storeToProduct) => {
                        return (
                          <EcommerceModuleProduct
                            key={storeToProduct.id}
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
                              return products?.map((product) => {
                                return (
                                  <Subject
                                    key={product.id}
                                    isServer={false}
                                    variant="me-ecommerce-module-product-card-default"
                                    ecommerceModuleProduct={product}
                                    ecommerceModuleStore={store}
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
}
