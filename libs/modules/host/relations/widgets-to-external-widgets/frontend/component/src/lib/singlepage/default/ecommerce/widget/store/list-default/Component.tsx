import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import { Component as EcommerceModuleStoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as RbacSubject } from "../../../../rbac/subject/me/ecommerce-product-action/Component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(
  props: ISpsComponentBase & {
    language: string;
  },
) {
  return (
    <EcommerceModuleStore isServer={props.isServer} variant="find">
      {({ data }) => {
        return data?.map((entity, index) => {
          return (
            <EcommerceModuleStore
              key={index}
              isServer={props.isServer}
              variant="default"
              data={entity}
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
                        {({ data }) => {
                          return data?.map((product, index) => {
                            return (
                              <EcommerceModuleProduct
                                key={index}
                                isServer={props.isServer}
                                variant="default"
                                data={product}
                                language={props.language}
                              >
                                <RbacSubject
                                  isServer={props.isServer}
                                  product={product}
                                  language={props.language}
                                  store={entity}
                                  variant="me-ecommerce-product-action"
                                />
                              </EcommerceModuleProduct>
                            );
                          });
                        }}
                      </EcommerceModuleProduct>
                    );
                  });
                }}
              </EcommerceModuleStoresToProducts>
            </EcommerceModuleStore>
          );
        });
      }}
    </EcommerceModuleStore>
  );
}
