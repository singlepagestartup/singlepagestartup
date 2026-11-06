import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as RbacModuleSubjectsToEcommerceModuleProducts } from "@sps/rbac/relations/subjects-to-ecommerce-module-products/frontend/component";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  const slug = props.subjectSlug;
  if (!slug) {
    return <></>;
  }
  return (
    <RbacModuleSubject
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: slug,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        return data?.map((subject, index) => {
          return (
            <RbacModuleSubjectsToEcommerceModuleProducts
              key={subject.id}
              isServer={props.isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "subjectId",
                        method: "eq",
                        value: subject.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data: subjectsToEcommerceModuleProducts }) => {
                return (
                  <div className="grid lg:grid-cols-2 gap-4">
                    {subjectsToEcommerceModuleProducts?.map(
                      (subjectToEcommerceModuleProduct, index) => {
                        return (
                          <EcommerceModuleProduct
                            key={subjectToEcommerceModuleProduct.id}
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
                                        subjectToEcommerceModuleProduct.ecommerceModuleProductId,
                                    },
                                  ],
                                },
                              },
                            }}
                          >
                            {({ data: products }) => {
                              return products?.map((product, index) => {
                                return (
                                  <RbacModuleSubject
                                    key={product.id}
                                    isServer={false}
                                    variant="me-ecommerce-module-product-card-default"
                                    ecommerceModuleProduct={product}
                                    language={props.language}
                                  />
                                );
                              });
                            }}
                          </EcommerceModuleProduct>
                        );
                      },
                    )}
                  </div>
                );
              }}
            </RbacModuleSubjectsToEcommerceModuleProducts>
          );
        });
      }}
    </RbacModuleSubject>
  );
}
